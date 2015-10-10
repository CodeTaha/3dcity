'use strict';

var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var CommunityCommentSchema = new Schema({
  communityId: {
    type: Schema.Types.ObjectId,
    ref: 'Community',
    required: true
  },
  userId: {
    type: Schema.Types.ObjectId,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  comment: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    required: true
  }
});

var CommunityComment = mongoose.model('CommunityComment', CommunityCommentSchema);

exports.create = function(communityComment, cb) {
  CommunityComment.create({
    communityId: communityComment.communityId,
    userId: communityComment.userId,
    name: communityComment.name,
    email: communityComment.email,
    comment: communityComment.comment,
    date: new Date()
  }, cb);
};

exports.get = function(communityId, limit, skip, cb) {
  CommunityComment.find({communityId: communityId})
  .sort({'date': -1})
  .skip(skip)
  .limit(limit)
  .exec(function(err, communityComments) {
    if (err) {
      cb(err);
    } else if (communityComments && !communityComments.length) {
      cb(null, []);
    } else {
      cb(null, communityComments);
    }
  });
};

exports.getByUser = function(user, limit, skip, cb) {
  CommunityComment.find({userId: user._id})
  .sort({'date': -1})
  .skip(skip)
  .limit(limit)
  .exec(function(err, communityComments) {
    if (err) {
      cb(err);
    } else if (communityComments && !communityComments.length) {
      cb(null, []);
    } else {
      cb(null, communityComments);
    }
  });
};

exports.delete = function(communityId, id, cb) {
  CommunityComment.remove({
    communityId: communityId,
    _id: id
  }, cb);
};

exports.model = CommunityComment;
