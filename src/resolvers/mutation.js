const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const gravatar = require('gravatar');
const { AuthenticationError, ForbiddenError } = require('apollo-server-express');
require('dotenv').config();

module.exports = {
  newNote: async (parent, args, { models, user }) => {
    // Check to see if user is passed into the function
    // throw Authentication Error if no user is on the context
    if(!user){
      throw new AuthenticationError('You must be signed in to create a note');
    }

    return await models.Note.create({
      content: args.content,
      // reference the author's mongo id
      author: mongoose.Types.ObjectId(user.id)
    });
  },
  deleteNote: async (parent, { id }, { models, user }) => {
    // if not a user, throw Authentication Error
    if(!user){
      throw new AuthenticationError('You must be signed in todelete a note');
    }

    // find the note
    const note = models.Note.findById(id);

    // if the note owner and current owner don't match,throw a forbidden error
    if(note && String(note.author !== user.id)){
      throw new ForbiddenError("You don't have permission to delete the note");
    }

    // If everything checks out, remove the note.
    try {
      await note.remove()
      return true;
    } catch (err) {
      // if there's an error along the way return false
      return false;
    }
  },
  updateNote: async (parent, {id, content}, { models, user }) => {
    // if not a user, throw AuthenticationError
    if(!user) {
      throw new AuthenticationError('You must be signed in to update a note')
    }
    
    // find the note
    const note = models.Note.findById(id);

    // if note owner and current user don't match, throw a forbidden error
    if(note && String(note.author) !== user.id){
      throw new ForbiddenError("You don't have permission to update the note");
    }

    //  update the note in the db and return the updated note
    return await models.Note.findOneAndUpdate(
      {
        _id: id
      },
      {
        $set: {
          content
        }
      },
      {
        new: true
      }
    );
  },

  signUp: async (parent, { username, email, password }, { models }) => {
    email = email.trim().toLowerCase();

    // hash password
    const hash = await bcrypt.hash(password, 10);
    // Create Gravatar
    const avatar = gravatar.url(email, {s: '200', r: 'pg', d: '404'});
    try {
      const user = await models.User.create({
        username,
        email,
        avatar,
        password: hash
      });

      // Create and return json web token
      return jwt.sign({ id: user._id}, process.env.JWT_SECRET);
    } catch (err) {
      // if there's a problem creating the account, throw an error
      console.log(err);
      throw new Error('Error creating account');
    }
  },

  signIn: async (parent, { username, email, password }, { models }) => {
    if(email){
      email = email.trim().toLowerCase();
    }

    const user = await models.User.findOne({
      $or: [{ email }, { username }]
    });

    // if no user is found, throw an Authentication Error 
    if(!user){
      throw new AuthenticationError('No User Found');
    }

    // if password does not match, throw an Authentication Error
    const valid = await bcrypt.compare(password, user.password);
    if(!valid){
      throw new AuthenticationError('Password does not Match');
    }

    // create and return json web token
    return jwt.sign({ id: user._id}, process.env.JWT_SECRET);
  },
  toggleFavorite: async (parent, { id }, {models, user}) => {
    // if no user context is passed, throw an Authentication Error
    if(!user) {
      throw new AuthenticationError();
    }

    // Check to see if the user has already favorite the note
    let noteCheck = await models.Note.findById(id);
    const hasUser = noteCheck.favoritedBy.indexOf(user.id);

    // if the user exists in the list
    // pull them from the list and reduce the favoriteCount by 1
    if(hasUser>= 0){
      return await models.Note.findOneAndUpdate(
        id,
        {
          $pull: {
            favoritedBy: mongoose.Types.ObjectId(user.id)
          },
          $inc: {
            favoriteCount: -1
          }
        },
        {
          // set new to true to return the updated doc
          new: true
        }
      );
    } else {
      // if the user don't exist in the list
      // add them to the list and increment the favorite count by 1
      if(hasUser<0){
        return await models.Note.findOneAndUpdate(
          id, 
          {
            $push: {
              favoritedBy: mongoose.Types.ObjectId(user.id)
            },
            $inc: {
              favoriteCount: 1
            }
          },
          {
            // set new to true to return the updated doc
            new: true
          }
        );
      }
    }
  },
}