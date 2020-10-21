const mongodb = require('mongodb');
// const express = require('express');
// const router = express.Router();

const {
  GraphQLObjectType,
  GraphQLString,
  GraphQLInt,
  GraphQLSchema,
  GraphQLList,
  GraphQLNonNull,
} = require('graphql');

//  Connect to user collection
let loadMongoCollection = async (collection) => {
  const client = await mongodb.MongoClient.connect(
    'mongodb+srv://milton:milton@bbgcluster-m9enp.mongodb.net/test?retryWrites=true&w=majority',
    { useNewUrlParser: true }
  );

  return client.db('BbgCluster').collection(`${collection}`);
};

/**********************
 *      Types
 *********************/

const UserType = new GraphQLObjectType({
  name: 'User',
  fields: () => ({
    _id: { type: GraphQLString },
    email: { type: GraphQLString },
    name: { type: GraphQLString },
    username: { type: GraphQLString },
    password: { type: GraphQLString },
  }),
});

/**********************
 *      Root Query
 *********************/

const RootQuery = new GraphQLObjectType({
  name: 'RootQueryType',
  fields: {
    // Single User
    user: {
      type: UserType,
      args: {
        username: { type: GraphQLString },
      },
      async resolve(parentValue, args) {
        const users = await loadMongoCollection('Users');
        // console.log(await users.find({ username: args.username }).toArray());
        const foundUser = await users.findOne({ username: args.username });
        return foundUser;
      },
    },
    // All users
    users: {
      type: new GraphQLList(UserType),
      async resolve(parentValue, args) {
        let users = await loadMongoCollection('Users');
        users = await users.find({}).toArray();
        return users;
      },
    },
  },
});

/**********************
 *      Mutations
 *********************/
const mutation = new GraphQLObjectType({
  name: 'Mutation',
  fields: {
    /*****************
     * User Mutation
     ****************/
    /** Add User **/
    addUser: {
      type: UserType,
      args: {
        name: { type: new GraphQLNonNull(GraphQLString) },
        email: { type: new GraphQLNonNull(GraphQLString) },
        username: { type: new GraphQLNonNull(GraphQLString) },
        password: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parentValue, args, res) {
        try {
          const users = await loadMongoCollection('Users');
          await users.insertOne({
            name: args.name,
            email: args.email,
            username: args.username,
            password: args.password,
          });

          return "status: 'ok'";
        } catch (e) {
          return e;
        }
      },
    },
    /** Delete User **/
    deleteUser: {
      type: UserType,
      args: {
        _id: { type: new GraphQLNonNull(GraphQLString) },
      },
      async resolve(parentValue, args, res) {
        try {
          const users = await loadMongoCollection('Users');
          await users.deleteOne({
            _id: new mongodb.ObjectID(args._id),
          });
          return "status: 'ok'";
        } catch (e) {
          return e;
        }
      },
    },
    /** Update User **/
    updateUser: {
      type: UserType,
      args: {
        _id: { type: new GraphQLNonNull(GraphQLString) },
        name: { type: GraphQLString },
        email: { type: GraphQLString },
        username: { type: GraphQLString },
        password: { type: GraphQLString },
      },
      async resolve(parentValue, args, res) {
        try {
          const users = await loadMongoCollection('Users');
          // Create new object to apply & remove id key
          let updated = Object.assign({}, args);
          delete updated['_id'];
          await users.updateOne(
            {
              _id: new mongodb.ObjectID(args._id),
            },
            {
              $set: updated,
            }
          );
          return "status: 'ok'";
        } catch (e) {
          console.log(e);
          return e;
        }
      },
    },
  },
});

module.exports = new GraphQLSchema({
  query: RootQuery,
  mutation,
});
