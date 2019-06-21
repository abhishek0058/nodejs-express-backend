const pool = require('./pool');

module.exports = {
  executeQuery: async (query, params) => {
    return new Promise((resolve, reject) => {
      try {
        pool.query(query, params, (err, response) => {
          if (err) reject(err);
          else resolve(response);
        });
      } catch (err) {
        console.log("executeQuery ->", err);
        reject(err);
      }
    });
  }
};

