const readline = require('readline');
const bcrypt = require('bcryptjs');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Enter the new admin password: ', async (password) => {
  if (!password) {
    console.error('Password cannot be empty.');
    rl.close();
    process.exit(1);
  }

  const hash = await bcrypt.hash(password, 12);
  console.log('\nAdd this value to the backend environment as ADMIN_PASSWORD_HASH:');
  console.log(hash);
  console.log('\nDo not commit this hash or the plaintext password.');
  rl.close();
});