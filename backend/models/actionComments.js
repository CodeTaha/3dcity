'use strict';

var mongoose = require('mongoose');
var _ = require('underscore');
var Schema = mongoose.Schema;

var ActionCommentSchema = new Schema({
  actionId: {
    type: Schema.Types.ObjectId,
    ref: 'Action',
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
  },
  hasPicture: {
    type: Boolean,
    default: false
  },
  ratings: {
    type: Schema.Types.Mixed,
    default: {}
  }
});

var ActionComment = mongoose.model('ActionComment', ActionCommentSchema);

var calcRating = function(aComment, userId) {
  var totalRating = 0;
  _.each(aComment.ratings, function(rating) {
    if (rating.value) {
      totalRating += 1;
    }
  });
  aComment.numLikes = totalRating;

  // include user's rating
  // console.log("uuuserId: "+userId);
  userId = String(userId);
  if (userId && aComment.ratings && aComment.ratings[userId]) {
    aComment.userRating = aComment.ratings[userId].value;
  }
  delete(aComment.ratings);
  // console.log("aComment2: "+JSON.stringify(aComment, null, 4));
};

exports.create = function(aComment, cb) {
  ActionComment.create({
    actionId: aComment.actionId,
    userId: aComment.userId,
    name: aComment.name,
    email: aComment.email,
    comment: aComment.comment,
    ratings: aComment.ratings || {},
    date: new Date()
  }, function(err, aComment) {
    if (err) {
      return cb(err);
    }

    aComment = aComment.toObject();
    calcRating(aComment, aComment.userId);

    cb(err, aComment);
  });
};

exports.setHasPicture = function(commentId, value, cb) {
  ActionComment.findOne({_id: commentId})
  .exec(function(err, aComment) {
    if (err) {
      return cb(err);
    }
    if (!aComment) {
      return cb('aComment not found!');
    }

    aComment.hasPicture = value;
    aComment.save(function(err) {
      /* istanbul ignore if: db errors are hard to unit test */
      if (err) {
        return cb(err);
      }

      aComment = aComment.toObject();
      calcRating(aComment, null);

      cb(err, aComment);
    });
  });
};

exports.get = function(actionId, limit, skip, user, cb) {
  ActionComment.find({actionId: actionId})
  .sort({'date': -1})
  .skip(skip)
  .limit(limit)
  .exec(function(err, aComments) {
    if (err) {
      cb(err);
    } else if (aComments && !aComments.length) {
      cb(null, []);
    } else {
      for (var i = 0; i < aComments.length; i++) {
        aComments[i] = aComments[i].toObject();
      }

      _.each(aComments, function(aComment) {
        calcRating(aComment, user ? user._id : null);
      });

      cb(null, aComments);
    }
  });
};

exports.getByUser = function(user, limit, skip, cb) {
  ActionComment.find({userId: user._id})
  .sort({'date': -1})
  .skip(skip)
  .limit(limit)
  .exec(function(err, aComments) {
    if (err) {
      cb(err);
    } else if (aComments && !aComments.length) {
      cb(null, []);
    } else {
      for (var i = 0; i < aComments.length; i++) {
        aComments[i] = aComments[i].toObject();
      }

      _.each(aComments, function(aComment) {
        calcRating(aComment, user ? user._id : null);
      });

      cb(null, aComments);
    }
  });
};

exports.delete = function(actionId, id, cb) {
  ActionComment.remove({
    actionId: actionId,
    _id: id
  }, cb);
};

exports.rate = function(actionId, commentId, user, rating, cb) {
  if (!user || !user._id) {
    return cb('Missing/invalid user');
  }
  if (!_.isNumber(rating)) {
    return cb('Missing/invalid rating');
  }
  ActionComment.findOne({
    actionId: actionId,
    _id: commentId
  }, function(err, aComment) {
    if (err) {
      cb(err);
    } else if (!aComment) {
      cb('Action comment not found');
    } else {
      // only allow values 0, 1
      if (rating !== 0 && rating !== 1) {
        return cb('invalid rating! should be 0 or 1');
      }

      aComment.ratings[user._id] = {
        value: rating,
        date: new Date()
      };
      aComment.markModified('ratings');
      aComment.save(function(err) {
        /* istanbul ignore if: db errors are hard to unit test */
        if (err) {
          return cb(err);
        }

        aComment = aComment.toObject();
        calcRating(aComment, user._id);

        cb(err, aComment);
      });
    }
  });
};

exports.model = ActionComment;
