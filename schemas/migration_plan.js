'use strict';
/*
  NORIX Student Migration Plan (MongoDB)
  - Adds missing fields safely
  - Initializes defaults:
      verified: false
      reliability_score: 0
      total_shifts: 0
      no_shows: 0
  - Recalculates reliability_score as:
      if total_shifts > 0:
        reliability_score = clamp( round(100 * (1 - no_shows / total_shifts)), 0, 100 )
      else:
        0
  - Runs post-migration tests and prints success/failure message.
  - Designed for mongosh/mongo shell environment (uses global `db`).
*/

(function migrateStudents() {
  if (typeof db === 'undefined' || !db) {
    throw new Error('This script must be run in a MongoDB shell context where `db` is defined.');
  }

  var collectionName = 'students';
  try {
    // Ensure collection exists (no-op if already exists)
    db.createCollection(collectionName);
  } catch (e) {
    // ignore if collection already exists
  }
  var students = db.getCollection(collectionName);

  // 1) Add missing string fields safely (do not enforce college_email, it's optional)
  students.updateMany({ name: { $exists: false } }, { $set: { name: "" } });
  students.updateMany({ phone: { $exists: false } }, { $set: { phone: "" } });
  students.updateMany({ college: { $exists: false } }, { $set: { college: "" } });
  // id_doc_url must exist (can be empty string if not yet uploaded)
  students.updateMany({ id_doc_url: { $exists: false } }, { $set: { id_doc_url: "" } });

  // 2) Initialize/normalize arrays for skills and availability
  //    - If not arrays: set to []
  //    - Coerce items to string
  students.updateMany(
    {},
    [
      {
        $set: {
          skills: {
            $cond: [
              { $isArray: "$skills" },
              {
                $map: {
                  input: "$skills",
                  as: "s",
                  in: { $toString: "$$s" }
                }
              },
              []
            ]
          },
          availability: {
            $cond: [
              { $isArray: "$availability" },
              {
                $map: {
                  input: "$availability",
                  as: "a",
                  in: { $toString: "$$a" }
                }
              },
              []
            ]
          }
        }
      }
    ]
  );

  // 3) Ensure verified exists as boolean and defaults to false
  //    - If missing OR not a boolean, set to false
  students.updateMany(
    {
      $or: [
        { verified: { $exists: false } },
        { $expr: { $ne: [ { $type: "$verified" }, "bool" ] } }
      ]
    },
    [
      { $set: { verified: false } }
    ]
  );

  // 4) Initialize numeric fields to 0 if missing or not numeric
  var numericFields = ["reliability_score", "total_shifts", "no_shows"];
  numericFields.forEach(function(fieldName) {
    // Build dynamic condition and set docs
    var cond = {
      $or: [
        {}
      ]
    };
    cond.$or[0][fieldName] = { $exists: false };
    cond.$or.push({
      $expr: {
        $not: {
          $in: [ { $type: "$" + fieldName }, ["int", "long", "double", "decimal"] ]
        }
      }
    });
    var setDoc = {};
    setDoc[fieldName] = 0;
    students.updateMany(cond, [ { $set: setDoc } ]);
  });

  // 5) Recalculate reliability_score with clamping to [0, 100]
  students.updateMany(
    {},
    [
      {
        $set: {
          reliability_score: {
            $let: {
              vars: {
                ts: { $toDouble: "$total_shifts" },
                ns: { $toDouble: "$no_shows" }
              },
              in: {
                $cond: [
                  { $gt: [ "$$ts", 0 ] },
                  {
                    $min: [
                      100,
                      {
                        $max: [
                          0,
                          {
                            $round: [
                              { $multiply: [ 100, { $divide: [ { $subtract: [ "$$ts", "$$ns" ] }, "$$ts" ] } ] },
                              0
                            ]
                          }
                        ]
                      }
                    ]
                  },
                  0
                ]
              }
            }
          }
        }
      }
    ]
  );

  // --- Post-migration Tests ---
  var requiredFields = [
    "name",
    "phone",
    "college",
    "id_doc_url",
    "skills",
    "availability",
    "verified",
    "reliability_score",
    "total_shifts",
    "no_shows"
  ];

  // Ensure all required fields exist
  var missingFieldCounts = {};
  for (var i = 0; i < requiredFields.length; i++) {
    var f = requiredFields[i];
    var q = {};
    q[f] = { $exists: false };
    missingFieldCounts[f] = students.countDocuments(q);
  }

  // reliability_score is between 0–100 and numeric
  var invalidReliabilityCount = students.countDocuments({
    $or: [
      { reliability_score: { $lt: 0 } },
      { reliability_score: { $gt: 100 } },
      { $expr: { $not: { $in: [ { $type: "$reliability_score" }, ["int","long","double","decimal"] ] } } }
    ]
  });

  // Confirm no document missing verified or id_doc_url
  var missingVerifiedOrId = students.countDocuments({
    $or: [
      { verified: { $exists: false } },
      { id_doc_url: { $exists: false } }
    ]
  });

  var totalMissingRequired = 0;
  Object.keys(missingFieldCounts).forEach(function(k) { totalMissingRequired += (missingFieldCounts[k] || 0); });

  if (totalMissingRequired === 0 && invalidReliabilityCount === 0 && missingVerifiedOrId === 0) {
    print("✅ Student migration completed successfully.");
  } else {
    print("❌ Student migration checks failed.");
    printjson({
      missingFieldCounts: missingFieldCounts,
      invalidReliabilityCount: invalidReliabilityCount,
      missingVerifiedOrId: missingVerifiedOrId
    });
    if (typeof quit === "function") { quit(1); }
  }
})(); 


