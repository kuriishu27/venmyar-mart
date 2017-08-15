/*
  Copyright (c) 2008 - 2016 MongoDB, Inc. <http://mongodb.com>

  Licensed under the Apache License, Version 2.0 (the "License");
  you may not use this file except in compliance with the License.
  You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

  Unless required by applicable law or agreed to in writing, software
  distributed under the License is distributed on an "AS IS" BASIS,
  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
  See the License for the specific language governing permissions and
  limitations under the License.
*/


var MongoClient = require('mongodb').MongoClient,
    assert = require('assert');

function ItemDAO(database) {
    "use strict";

    this.db = database;

    this.getCategories = function(callback) {
        "use strict";

        var categories = [];
        var category = {
            _id: "All",
            num: 999
        };

        var individualCategories = database.collection('item')
        .aggregate([
            { $group: {_id: "$category", num: {$sum: 1} } }, 
            { $sort: {"_id": 1} }
        ])

        individualCategories.forEach(function(doc) {
            categories.push(doc);
        }, function(err) {
            assert.equal(err, null);
        })

        var allCategories = database.collection('item')
        .aggregate([
            { $group: {_id: "$category", num: {$sum: 1} } }, 
            {$group: {_id: "All", num: {$sum: "$num"}}}
        ])
        
        allCategories.forEach(function(doc) {
            category.num = doc.num
            categories.push(category)
        }, function(err) {
            assert.equal(err, null);
        })

        setTimeout(() => {
            callback(categories);
        }, 100)
    }


    this.getItems = function(category, page, itemsPerPage, callback) {
        "use strict";

        var query = {}
        var pageItems = [];

        if (category !== "All") {
            query = {"category" : category}
        }

        if (page > 0) {
            var cursor = database.collection('item')
                .find(query)
                .sort({"title" : 1 })
                .skip(itemsPerPage * page)
                .limit(itemsPerPage)
        } else {
            var cursor = database.collection('item')
                .find(query)
                .sort({"title" : 1 })
                .limit(itemsPerPage)
        }
            

        cursor.forEach(function(doc) {
            pageItems.push(doc);
        }, function(err) {
            assert.equal(err, null);
        });
        setTimeout(() => {
            callback(pageItems);
        }, 100);

    }


    this.getNumItems = function(category, callback) {
        "use strict";

        var numItems = 0;

        if (category == "All") {
            var allCategories = database.collection('item')
                .aggregate([
                    { $group: {_id: "$category", num: {$sum: 1} } }, 
                    {$group: {_id: "All", num: {$sum: "$num"}}}
                ])
            
            allCategories.forEach(function(doc) {
                numItems = doc.num
            }, function(err) {
                assert.equal(err, null);
            })

            setTimeout(() => {
                callback(numItems);
            }, 100)

        } else {
            var query = database.collection('item')
                .aggregate([
                    { $match: {"category": category}},
                    { $group: {_id: "$category", num: {$sum: 1} } }
                ]);

            query.forEach(function(doc) {
                numItems = doc.num;
            }, function(err) {
                assert.equal(err, null);
            })

            setTimeout(() => {
                callback(numItems);
            }, 100)
        }

    }


    this.searchItems = function(query, page, itemsPerPage, callback) {
        "use strict";

        var items = [];

        if (page > 0) {
            var cursor = database.collection('item')
                .find({ $text: { $search: query } })
                .sort({"title" : 1 })
                .skip(itemsPerPage * page)
                .limit(itemsPerPage)
        } else {
            var cursor = database.collection('item')
                .find({ $text: { $search: query } })
                .sort({"title" : 1 })
                .limit(itemsPerPage)
        }
            

        cursor.forEach(function(doc) {
            items.push(doc);
        }, function(err) {
            assert.equal(err, null);
        });
        setTimeout(() => {
            callback(items);
        }, 100);
    }


    this.getNumSearchItems = function(query, callback) {
        "use strict";

        var numItems = 0;

        var cursor = database.collection('item').aggregate([
            { $match: {$text: { $search: query } } }, 
            { $group: {_id: null, num: {$sum: 1}}}
        ])

        cursor.forEach(function(doc) {
            numItems = doc.num;
            console.log(numItems);

        }, function(err) {
            assert.equal(err, null);
        });
        setTimeout(() => {
            callback(numItems);
        }, 100);

    }


    this.getItem = function(itemId, callback) {
        "use strict";

        var item = {};

        var cursor = database.collection('item')
            .find({_id: itemId})

        cursor.forEach(function(doc) {
            item = doc
        }, function(err) {
            assert.equal(err, null);
        });
        setTimeout(() => {
            callback(item);
        }, 100);
    }


    this.getRelatedItems = function(callback) {
        "use strict";

        this.db.collection("item").find({})
            .limit(4)
            .toArray(function(err, relatedItems) {
                assert.equal(null, err);
                callback(relatedItems);
            });
    };


    this.addReview = function(itemId, comment, name, stars, callback) {
        "use strict";

        var itemForReview = {};

        var cursor = database.collection('item')
            .find({_id: itemId})

        cursor.forEach(function(doc) {
            itemForReview = doc
        }, function(err) {
            assert.equal(err, null);
        });
        setTimeout(() => {
            var reviewDoc = {
                name: name,
                comment: comment,
                stars: stars,
                date: Date.now()
            }
            if (itemForReview.reviews !== undefined) {
                itemForReview.reviews.push(reviewDoc);
            } else {
                itemForReview.reviews = [reviewDoc];
            }
            
            database.collection('item')
                .update(
                    {_id: itemId}, 
                    {$set: {"reviews" : itemForReview.reviews}
                });

            callback(itemForReview);

        }, 100);
    }


    // this.createDummyItem = function() {
    //     "use strict";

    //     var item = {
    //         _id: 1,
    //         title: "Gray Hooded Sweatshirt",
    //         description: "The top hooded sweatshirt we offer",
    //         slogan: "Made of 100% cotton",
    //         stars: 0,
    //         category: "Apparel",
    //         img_url: "/img/products/hoodie.jpg",
    //         price: 29.99,
    //         reviews: []
    //     };

    //     return item;
    // }
}


module.exports.ItemDAO = ItemDAO;
