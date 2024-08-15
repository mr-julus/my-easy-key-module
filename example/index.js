const MyEasyKeyManager = require('my-easy-key');

const configs = {
  apiKey: "YOUR FIREBASE API KEY",
  authDomain: "YOUR FIREBASE AUTH DOMAIN",
  databaseURL: "YOUR FIREBASE DATABASE URL",
  projectId: "YOUR FIREBASE PROJECT ID",
  storageBucket: "YOUR FIREBASE STORAGE BUCKET",
  messagingSenderId: "YOUR FIREBASE MESSAGING SENDER ID",
  appId: "YOUR FIREBASE APP ID",
  measurementId: "YOUR MEASUREMENT ID",
  showConsoleMessages: true // if you want to show console messages
};

const myeasykey = new MyEasyKeyManager(configs); // Initialization

(async () => {
  await myeasykey.checkSystem();

  const token = await myeasykey.createKey('username'); // Create a token
  console.log('Token:', token);

  const key = await myeasykey.getKey(token); // Get the key from a token
  console.log('Key:', key);

  const keyInformations = await myeasykey.getKeyInformations(token); // Get information about the key
  console.log('Key Informations:', keyInformations);
  console.log('Key URL : ' + keyInformations.url);

  const KeyFromUsername = await myeasykey.getKeyFromUsername('username'); // Get the key from a username
  console.log('Key from Username:', KeyFromUsername);

  const KeyFromURL = await myeasykey.getKeyFromURL('https://firebasestorage.googleapis.com/v0/b/bgsn-network.appspot.com/o/6RxQObjqkx%2F99249%2Findex.html?alt=media&token=1670703d-0368-4783-aac6-bb8a7f051435'); // Get the key from a URL
  console.log('Key from URL:', KeyFromURL);

  const TokenFromKey = await myeasykey.getTokenFromKey('3888595399K'); // Get the token from a user's key
  console.log('Token from key:', TokenFromKey);

  const UserExist = await myeasykey.getUserExist('username'); // Returns true if the username exists and false if it doesn't
  console.log('The username is available: ' + UserExist);

  await myeasykey.removeKey(token); // Delete a key
  console.log('Token removed');

  const newKey = await myeasykey.changeKey(token); // Change the value of a key
  console.log('Key changed:', newKey);

  await myeasykey.updateUserData(token, 'Field', 'NewValue'); // Change the value of a field in a key
  console.log('User data updated');

  await myeasykey.settings_automatic_update(token, '17H28'); // Set the time for automatic key update
  console.log('Automatic settings updated');

  const matchingKeys = await myeasykey.checkTime(); // Retrieve the token(s) where a key needs to be updated
  console.log('Token(s) where key has to be updated:', matchingKeys);

  const linkvertiseLink = await myeasykey.createLink("YOUR_LINKVERTISE_TOKEN", "https://yoursite.com/yourpage");
  console.log("Your monetized link is: " + linkvertiseLink);
})();
