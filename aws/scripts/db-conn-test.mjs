import pkg from 'pg';
const { Client } = pkg;

async function checkDbConnection(password) {
  const client = new Client({
    host: 'lmsdata-intodb0d70fd53-at9wlsbtm9re.cnekeec6mz0y.ap-southeast-2.rds.amazonaws.com',
    port: 5432,
    database: 'moodle',
    user: 'intocollege',
    password,
    // // must set this to false due to self-signed certificates in RDS
    // // otherwise, got error: Failed to connect to the database: error: no pg_hba.conf entry for host ...
    // ssl: {
    //   rejectUnauthorized: false,
    // },
  });

  try {
    await client.connect();
    console.log('Connected to the database successfully!');
  } catch (err) {
    console.error('Failed to connect to the database:', err);
  } finally {
    await client.end();
  }
}

checkDbConnection(process.argv[2]);
