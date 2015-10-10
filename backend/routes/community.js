'use strict';

var express = require('express');
var util = require('util');
var auth = require('../middleware/auth');
var path = require('path');
var common = require('./common');
var router = express.Router();
var achievements = require('../common/achievements');
var Community = require('../models').communities;
var User = require('../models').users;
var CommunityComment = require('../models').communityComments;
var Log = require('../models').logs;

/**
 * @api {post} /community/:communityId/comment Create new community comment
 * @apiGroup Community Comments
 *
 * @apiParam {String} communityId ID of community being commented
 * @apiParam {String} comment Text contents of comment
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "comment": "This is a fun community!"
 *  }' \
 *  http://localhost:3000/api/community/555f0163688305b57c7cef6c/comment
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 0,
 *     "communityId": "555f0163688305b57c7cef6c",
 *     "userId": "555f0163688305b57c7cef6e",
 *     "name": "Test User",
 *     "email": "testuser1@test.com",
 *     "comment": "This is a fun community!",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "_id": "555f0163688305b57c7cef6d",
 *   }
 */
router.post('/:communityId/comment', auth.authenticate(), function(req, res) {
  var communityComment = req.body;
  communityComment.actionId = req.params.actionId;
  communityComment.userId = req.user._id;
  communityComment.name = req.user.profile.name;
  communityComment.email = req.user.email;
  CommunityComment.create(communityComment, res.successRes);

  Log.create({
    userId: req.user._id,
    category: 'Community Comments',
    type: 'create',
    data: communityComment
  });
});

/**
 * @api {get} /community/:communityId/comments Get a list of community comments
 * @apiGroup Community Comments
 *
 * @apiParam {String} communityId ID of community whose comments are requested
 * @apiParam {Integer} [limit=10] Maximum number of results returned
 * @apiParam {Integer} [skip=0] Number of results skipped
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "limit": "50",
 *    "skip": "0"
 *  }' \
 *  http://localhost:3000/api/community/555f0163688305b57c7cef6c/comments
 *
 * @apiSuccessExample {json} Success-Response:
 * [
 *   {
 *     "_id": "555f0163688305b57c7cef6d",
 *     "communityId": "555f0163688305b57c7cef6c",
 *     "name": "Test User",
 *     "email": "testuser1@test.com",
 *     "comment": "This is a fun community!",
 *     "date": "2015-07-01T12:04:33.599Z",
 *     "__v": 0,
 *   },
 *   ...
 * ]
 */
router.get('/:communityId/comments', auth.authenticate(), function(req, res) {
  CommunityComment.get(
      req.params.communityId, req.body.limit || 10, req.body.skip || 0, res.successRes);

  Log.create({
    userId: req.user._id,
    category: 'Community Comments',
    type: 'get',
    data: {
      communityId: req.params.communityId,
      limit: req.body.limit,
      skip: req.body.skip
    }
  });
});

/**
 * @api {delete} /community/:communityId/comment/:commentId Delete a comment
 * @apiGroup Community Comments
 *
 * @apiParam {String} communityId ID of community whose comment will be deleted
 * @apiParam {String} commentId ID of comment to be deleted
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X DELETE -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/555f0163688305b57c7cef6c/comment/555f0163688305b57c7cef6d
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "ok":1,
 *     "n":1
 *   }
 */
router.delete('/:communityId/comment/:commentId', auth.authenticate(), function(req, res) {
  CommunityComment.delete(req.params.communityId, req.params.commentId, res.successRes);

  Log.create({
    userId: req.user._id,
    category: 'Community Comments',
    type: 'delete',
    data: req.params
  });
});

/**
 * @api {post} /community Create new community
 * @apiGroup Community
 *
 * @apiParam {String} name Unique Name of the community
 * @apiParam {Array} challenges Challenges specific to the community
 * @apiParam {Array} actions Actions specific to the community
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "name": "Otaniemi Community",
 *    "challenges": [
 *      {
 *        "id": "555eda2531039c1853352b7f",
 *        "name": "Reduce energy consumption by 10%"
 *      },
 *      {
 *        "id": "455eda2531039c1853335b7f",
 *        "name": "Save for 2 solar panels for the area"
 *      }
 *    ],
 *    "actions": [
 *      {
 *        "id": "345eda2531039c1853352b7f",
 *        "name": "Use the clothes washer/dryer only once per week"
 *      },
 *      {
 *        "id": "7645eda34531039c1853352b7f",
 *        "name": "Turn off lights during the day in Summer"
 *      }
 *    ],
 *    "members": [
 *      {
 *        "_id": "testUser1",
 *        "name": "Jane"
 *      },
 *      {
 *        "_id": "testUser2",
 *        "name": "Jack"
 *      }
 *    ]
 *  }' \
 *  http://localhost:3000/api/community
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 0,
 *     "_id": "555f0163688305b57c7cef6c",
 *     "name": "Otaniemi Community",
 *     "challenges": [
 *       {
 *         "id": "555eda2531039c1853352b7f",
 *         "name": "Reduce energy consumption by 10%"
 *       },
 *       {
 *         "id": "455eda2531039c1853335b7f",
 *         "name": "Save for 2 solar panels for the area"
 *       }
 *     ],
 *     "actions": [
 *       {
 *         "id": "345eda2531039c1853352b7f",
 *         "name": "Use the clothes washer/dryer only once per week"
 *       },
 *       {
 *         "id": "7645eda34531039c1853352b7f",
 *         "name": "Turn off lights during the day in Summer"
 *       }
 *     ],
 *     "members": [
 *       "User": {
 *         "_id": "testUser1",
 *         "name": "Jane"
 *       },
 *       "User": {
 *         "_id": "testUser2",
 *         "name": "Jack"
 *       }
 *     ],
 *     "date": "2015-07-01T12:04:33.599Z"
 *   }
 */
router.post('/', auth.authenticate(), function(req, res) {
  var community = req.body;
  community.ownerId = req.user._id;
  Community.create(community, res.successRes);
  Log.create({
    userId: req.user._id,
    category: 'Community',
    type: 'create',
    data: req.body
  });
});

/**
 * @api {get} /community/:id Fetch a community by id
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of community
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/555ecb997aa6360e40f26451
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "__v": 8,
 *     "_id": "555ef84b2fd41ffc6e078a34",
 *      "name": "Otaniemi Community",
 *     "challenges": [
 *       {
 *       "id": "555eda2531039c1853352b7f",
 *       "name": "Reduce energy consumption by 10%"
 *       },
 *       {
 *        "id": "455eda2531039c1853335b7f",
 *       "name": "Save for 2 solar panels for the area"
 *       }
 *    ],
 *     "actions": [
 *       {
 *       "id": "345eda2531039c1853352b7f",
 *       "name": "Use the clothes washer/dryer only once per week"
 *       },
 *       {
 *        "id": "7645eda34531039c1853352b7f",
 *       "name": "Turn off lights during the day in Summer"
 *       }
 *    ],
 *     "members": [
 *       {
 *         "_id": "testUser1",
 *         "name": "Jane",
 *       },
 *        {
 *         "_id": "testUser2",
 *         "name": "Jack",
 *       },
 *       ...
 *     ],
 *     "date": "2015-07-01T12:04:33.599Z"
 *   }
 */

router.get('/:id', auth.authenticate(), function(req, res) {
  req.checkParams('id', 'Invalid community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    Community.getCommunityInfo(req.params.id, res.successRes);

    Log.create({
      userId: req.user._id,
      category: 'Community',
      type: 'get',
      data: {
        actionId: req.params.id
      }
    });
  }
});

/**
 * @api {get} /community/list List all of user's communities
 * @apiGroup Community
 *
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/list
 */
router.get('/list', auth.authenticate(), function(req, res) {
  User.getUserCommunities(req.user._id, res.successRes);

  Log.create({
    userId: req.user._id,
    category: 'Community',
    type: 'listAll'
  });
});

/**
 * @api {delete} /household/:id Delete a Community by id
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of Community
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X DELETE -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/555ecb997aa6360e40f26451
 *
 * @apiSuccess {Integer} n Number of deleted communities (0 or 1)
 * @apiSuccess {Integer} ok Mongoose internals
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "n": 0,
 *     "ok": 1
 *   }
 */
router.delete('/:id', auth.authenticate(), function(req, res) {
  req.checkParams('id', 'Invalid Community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    Community.delete(req.params.id, res.successRes);

    Log.create({
      userId: req.user._id,
      category: 'Community',
      type: 'delete',
      data: {
        communityId: req.params.id
      }
    });
  }
});

/**
 * @api {put} /community/join/:id Join community
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of community
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/join/555ef84b2fd41ffef6e078a34
 */
router.put('/join/:id', auth.authenticate(), function(req, res) {
  req.checkParams('id', 'Invalid Community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    Community.addMember(req.params.id, req.user._id, function(err, community) {
      if (!err) {
        User.getUserCommunities(req.user._id, function(err, communities) {
          achievements.updateAchievement(req.user, 'communitiesJoined', function(oldVal) {
            // make sure we never decerase the achievement progress
            return Math.max(oldVal, communities.length);
          });
        });
      }

      res.successRes(err, community);
    });

    Log.create({
      userId: req.user._id,
      category: 'Community',
      type: 'join',
      data: req.params
    });
  }
});

/**
 * @api {put} /community/leave/:id Leave community
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of community
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Authorization: Bearer $API_TOKEN" -d \
 *  http://localhost:3000/api/community/leave/555ef84b2fd41ffef6e078a34
 */
// router.put('/leave/:id', auth.authenticate(), function(req, res) {
//   req.checkParams('id', 'Invalid Community id').isMongoId();
//
//   var err;
//   if ((err = req.validationErrors())) {
//     res.status(500).send('There have been validation errors: ' + util.inspect(err));
//   } else {
//     Community.removeMember(req.params.id, req.params.userId, req.user._id, res.successRes);
//
//     Log.create({
//       userId: req.user._id,
//       category: 'Community',
//       type: 'leave',
//       data: req.params
//     });
//   }
// });

// TODO: verify that this one works
/**
 * @api {get} /community/top/:id Display top actions from community
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of action
 * @apiParam {Integer} [limit=10] Count limit
 * @apiParam {Array} actions List of top actions in the community, actions with high rating
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X GET -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" \
 *  http://localhost:3000/api/community/top/315ea82f7fec0ffaee5
 */
router.get('/top/:id', auth.authenticate(), function(req, res) {
  req.checkParams('id', 'Invalid Community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    Community.topActions(req.params.id, req.body.limit, res.successRes);

    Log.create({
      userId: req.user._id,
      category: 'Community',
      type: 'top',
      data: {
        communityId: req.params.id,
        limit: req.body.limit
      }
    });
  }
});

/**
 * @api {post} /community/communityPicture/:communityId Update your Community picture
 * @apiGroup Community
 *
 * @apiParam {String} communityId MongoId of community
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/user/profile
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X POST -H "Content-Type: image/png" -H "Authorization: Bearer $API_TOKEN" \
 *  --data-binary @/path/to/picture.png \
 *  http://localhost:3000/api/community/communityPicture/555f0163688305b57c7cef6c
 *
 * @apiSuccessExample {json} Success-Response:
 * {
 *   "status": "ok"
 * }
 */
router.post('/communityPicture/:communityId', auth.authenticate(), function(req, res) {
  req.checkParams('communityId', 'Invalid Community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    return res.successRes('There have been validation errors: ' + util.inspect(err));
  }

  var imgPath = path.join(common.getUserHome(), '.youpower', 'communityPictures');
  common.uploadPicture(req, 512, imgPath, req.params.communityId, res.successRes);

  Log.create({
    userId: req.user._id,
    category: 'Community Picture',
    type: 'create',
    data: req.params.communityId
  });
});

/**
 * @api {put} /action/rate/:id Create/update community's rating by user
 * @apiGroup Community
 *
 * @apiParam {String} id MongoId of community
 * @apiParam {Number} rating Rating of community (0 = unlike, 1 = like)
 * @apiParam {String} [comment] Comment attached to rating
 *
 * @apiExample {curl} Example usage:
 *  # Get API token via /api/community/token
 *  export API_TOKEN=fc35e6b2f27e0f5ef...
 *
 *  curl -i -X PUT -H "Content-Type: application/json" -H "Authorization: Bearer $API_TOKEN" -d \
 *  '{
 *    "rating": 1,
 *    "comment": "This community is really awesome!"
 *  }' \
 *  http://localhost:3000/api/action/rate/555ef84b2fd41ffc6e078a34
 *
 * @apiSuccessExample {json} Success-Response:
 *   {
 *     "_id": "5594dbeadfbb985d0ac150c4",
 *     "name": "Otaniemi Community",
 *     "description": "Disabling standby can save up to 10% in total electricity costs.",
 *     "__v": 0,
 *     "ratings": {
 *       "5593ccfa9255daa130890164": {
 *         "date": "2015-07-02T06:37:39.845Z",
 *         "comment": "This community is really awesome!",
 *         "name": "Test User",
 *         "rating": 1
 *       }
 *     },
 *    "challenges": [
 *      {
 *        "id": "555eda2531039c1853352b7f",
 *        "name": "Reduce energy consumption by 10%"
 *      },
 *      {
 *        "id": "455eda2531039c1853335b7f",
 *        "name": "Save for 2 solar panels for the area"
 *      }
 *    ],
 *     "date": "2015-07-01T12:04:33.599Z",
 *      "members": [
 *      {
 *        "_id": "testUser1",
 *        "name": "Jane"
 *      },
 *      {
 *        "_id": "testUser2",
 *        "name": "Jack"
 *      }
 *    ]
 *   }
 */
router.put('/rate/:id', auth.authenticate(), function(req, res) {
  req.checkParams('id', 'Invalid community id').isMongoId();

  var err;
  if ((err = req.validationErrors())) {
    res.status(500).send('There have been validation errors: ' + util.inspect(err));
  } else {
    Community.rate(req.params.id, req.user, req.body.rating, req.body.comment, res.successRes);

    Log.create({
      userId: req.user._id,
      category: 'Community',
      type: 'rate',
      data: {
        communityId: req.params.id,
        rating: req.body.rating,
        comment: req.body.comment
      }
    });
  }
});

module.exports = router;
