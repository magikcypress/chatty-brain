'use strict';

const BrainJSClassifier = require('natural-brain');
const Datastore = require('nedb');
const _ = require('underscore');
const fs = require('fs');
const classifier = new BrainJSClassifier();
const learn = require('./datalearn.json');
const trainer = require('./datatrainer.json');

class BrainChatty {

  constructor (obj) {
    typeof obj !== 'object' ? obj = { db: 'data', slient: false, selfTrain: true } : ''
    this.db = obj.db || 'data';
    this.classifier = new BrainJSClassifier();
    this.db = new Datastore({ filename: `${this.db}.db`, autoload: true });
    this.db.ensureIndex({ fieldName: 'responses', unique: true }, function (err) {
      if (err) console.log(err);
    });
  }

  // Create natural-brain data
  learn () {
    // call a datalearn.json & save data into nedb
		for (let i = 0; i < learn.length; i++) {
			classifier.addDocument(learn[i]['phrase'], learn[i]['label']);
			classifier.retrain();
			this.db.insert({category: learn[i]['label'], responses: [learn[i]['phrase']], actions: []}, (err, newDoc) => {
			});
		}

    // call datatrainer.json and classifier
    for (let key in trainer)
    {
      if (trainer.hasOwnProperty(key))
      {
        classifier.classify(trainer[key].phrase);
      }
    }

	}

  // Save data ...
  save () {
    classifier.save('data.json', function(err, classifier) {
    });
  }

  // Search a classifier response & send or not
	query (obj) {
		let response;
		let classified = classifier.getClassifications(obj);
		classified = _.sortBy(classified, 'value')
		classified.reverse();
		let probability = 0;
		let value = classified[0].value;
		let label = classified[0].label;
    if (value > 0.8) {
      probability = 1;
    } else if (value > 0.3 && value < 0.8) {
      probability = 0.5;
    } else {
      probability = 0;
    }
		const category = classifier.classify(obj);
		return new Promise((resolve, reject) => {
		  this.db.findOne({category: category}, (err, doc) => {
	      if(!err) {
	        response = doc.responses[0];
	        classifier.addDocument(doc.responses[0], category);
	        classifier.retrain();
	        resolve({status: true, probability, response, details: classified});
	      }
		  });
		});
	}

}

module.exports = BrainChatty;
