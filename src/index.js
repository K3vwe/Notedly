const express = require('express');
const helmet = require('helmet');
const { ApolloServer, gql } = require('apollo-server-express');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const { createComplexityLimitRule } = require('graphql-validation-complexity');

require('dotenv').config();

// Run the server on the port specified by in the .env file
const port = process.env.PORT;
const DB_HOST = process.env.DB_HOST;

// Verify the validity of the token
// Get the user info from a JWT
const getUser = token => {
  if(token) {
    try {
      // return the user information from the token
      return jwt.verify(token, process.env.JWT_SECRET)
    } catch (err) {
      // if there is a problem with the token, throw an error
      throw new Error('Session Invalid');
    }
  }
}

async function startApolloServer() {
  // Local module imports

  const db = require('./db');
  
  const models = require('./models');
  // Construct a schema, using GraphQL schema language
  const typeDefs = require('./schema');

  // Provide resolver functions for your schema fields
  const resolvers = require('./resolvers');

  // Apollo Server setup
  const server = new ApolloServer({ 
    typeDefs, 
    resolvers,
    validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
    context: async ({ req }) => {
      // get the user token from the header
      const token = req.headers.authorization;
      // try to retrieve a user with the token
      const user = await getUser(token);
      // Add the DB models to the context
      return { models, user };
    } 
  });
  await server.start();

  const app = express();
  app.use(helmet());
  app.use(cors());
  db.connect(DB_HOST);

  // Apply Apollo GraphQL Middleware and set the path to /api
  server.applyMiddleware({ app, path: '/api' });

  await new Promise(resolve => app.listen({ port}, resolve));
  console.log(`🚀 Server ready at http://localhost:${port}${server.graphqlPath}`);
  return { server, app };
}

startApolloServer();