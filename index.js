const { config } = require('dotenv');
config();
const axios = require('axios');
const { initializeApp } = require('firebase/app');
const { getFirestore, query, where, getDocs, collection, doc, updateDoc, deleteDoc, addDoc, getDoc, deleteField, arrayUnion } = require('firebase/firestore');
const { getStorage, ref, uploadBytes, getDownloadURL, deleteObject } = require('firebase/storage');
const fs = require('fs');
const path = require('path');

class MyEasyKeyManager {
  constructor(configs) {
    this.validateConfigs(configs);
    
    this.firebaseConfig = {
      apiKey: configs.FirebaseApiKey,
      authDomain: configs.FirebaseAuthDomain,
      databaseURL: configs.FirebaseDatabaseURL,
      projectId: configs.FirebaseProjectId,
      storageBucket: configs.FirebaseStorageBucket,
      messagingSenderId: configs.FirebaseMessagingSenderId,
      appId: configs.FirebaseAppId,
      measurementId: configs.FirebaseMeasurementId
    };

    this.showConsoleMessages = configs.showConsoleMessages;
    
    // Initialize Firebase
    const app = initializeApp(this.firebaseConfig);
    this.db = getFirestore(app);
    this.storage = getStorage(app);
  }

  validateConfigs(configs) {
    const requiredConfigs = [
      'FirebaseApiKey',
      'FirebaseAuthDomain',
      'FirebaseDatabaseURL',
      'FirebaseProjectId',
      'FirebaseStorageBucket',
      'FirebaseMessagingSenderId',
      'FirebaseAppId',
      'FirebaseMeasurementId',
      'showConsoleMessages'
    ];

    for (const config of requiredConfigs) {
      if (configs[config] == null) {
        throw new Error(`Configuration error: ${config} is required.`);
      }
    }
  }

  log(message) {
    if (this.showConsoleMessages) {
      console.log(message);
    }
  }

  async checkSystem() {
    try {
      const docRef = doc(this.db, 'my-easy-key', 'settings');
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        this.log('Le document settings existe dans la collection my-easy-key.');
        return true;
      } else {
        this.log('Le document settings n\'existe pas dans la collection my-easy-key.');
        return false;
      }
    } catch (error) {
      console.error('Erreur lors de la vérification du document settings:', error);
      throw error;
    }
  }

  generateRandomNumberWithK() {
    let randomNumber = '';
    for (let i = 0; i < 10; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      randomNumber += randomDigit;
    }
    randomNumber += 'K';
    return randomNumber;
  }

  generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
      const randomIndex = Math.floor(Math.random() * characters.length);
      result += characters[randomIndex];
    }
    return result;
  }

  generateWebNumber() {
    let randomNumber = '';
    for (let i = 0; i < 5; i++) {
      const randomDigit = Math.floor(Math.random() * 10);
      randomNumber += randomDigit;
    }
    randomNumber += 'K';
    return randomNumber;
  }

  async initSettings(token) {
    const docRef = doc(this.db, "my-easy-key", "settings");
    try {
      await updateDoc(docRef, {
        [token]: "17H30"
      });
      this.log('Initialisation de settings terminé');
    } catch (error) {
      console.error(error);
    }
  }

  async initStorage(filePath, webID, webNB) {
    const fileName = path.basename(filePath);
    const storageRef = ref(this.storage, `${webID}/${webNB}/${fileName}`);
    const data = fs.readFileSync(filePath);

    try {
      await uploadBytes(storageRef, data);
      this.log('Initialisation de storage terminé');
    } catch (error) {
      console.error('Erreur lors de l\'upload du fichier :', error);
    }
  }

  async createKey(username) {
    const key = this.generateRandomNumberWithK();
    const webId = this.generateRandomString(12);
    const webNB = this.generateWebNumber();

    const newDocument = {
      username: username,
      activate: false,
      key: key,
      used_key: [key],
      web_id: webId,
      web_number: webNB,
      url: 'undefined'
    };

    try {
      const docRef = await addDoc(collection(this.db, 'my-easy-key'), newDocument);
      await this.initSettings(docRef.id);
      await this.initStorage('fichier.txt', webId, webNB);
      await this.createHTMLFile("index.html", docRef.id, key);
      await updateDoc(docRef, {
        token: docRef.id
      });
      this.log('Création du compte terminé!');
      return docRef.id;
    } catch (e) {
      console.error('Erreur lors de l\'ajout du document:', e);
    }
  }

  async getKey(accessCode) {
    const docRef = doc(this.db, 'my-easy-key', accessCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data().key;
    } else {
      throw new Error('Document does not exist');
    }
  }

  async getKeyInformations(key) {
    const docRef = doc(this.db, 'my-easy-key', key);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('Document does not exist');
    }
  }

  async getKeyFromUsername(username) {
    const querySnapshot = await getDocs(collection(this.db, 'my-easy-key'));
    let userKey = null;
    querySnapshot.forEach((doc) => {
      if (doc.data().username === username) {
        userKey = doc.data().key;
      }
    });
    if (userKey) {
      return userKey;
    } else {
      throw new Error('User not found');
    }
  }

  async getTokenFromKey(key) {
    const q = query(collection(this.db, 'my-easy-key'), where('key', '==', key));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().token;
    } else {
      throw new Error('User not found');
    }
  }

  async getTokenFromURL(url) {
    const q = query(collection(this.db, 'my-easy-key'), where('url', '==', url));
    const querySnapshot = await getDocs(q);
    if (!querySnapshot.empty) {
      const userDoc = querySnapshot.docs[0];
      return userDoc.data().token;
    } else {
      throw new Error('User not found');
    }
  }

  async getKeyFromURL(url) {
    try {
      const response = await axios.get(url);
      const key = response.data.trim();
      return key;
    } catch (error) {
      console.error(error);
    }
  }

  async getUserExist(username) {
    const querySnapshot = await getDocs(collection(this.db, 'my-easy-key'));
    let userKey = null;
    querySnapshot.forEach((doc) => {
      if (doc.data().username === username) {
        userKey = doc.data().key;
      }
    });
    return !!userKey;
  }

  async deleteSettings(fieldName) {
    const docRef = doc(this.db, "my-easy-key", "settings");
    try {
      await updateDoc(docRef, {
        [fieldName]: deleteField()
      });
      this.log('Suppression du champ dans settings terminé');
    } catch (error) {
      console.error("Erreur lors de la suppression du champ :", error);
    }
  }

  async removeKey(key) {
    const docRef = doc(this.db, 'my-easy-key', key);
    try {
      await deleteDoc(docRef);
      await this.deleteSettings(key);
      this.log('La clé a bien été supprimé');
    } catch (error) {
      console.error('Erreur lors de la suppression du document:', error);
    }
  }

  async getUsedKey(token) {
    const docRef = doc(this.db, 'my-easy-key', token);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      return data.used_key || [];
    } else {
      throw new Error('Document does not exist');
    }
  }

  async changeKey(token) {
    const newKey = this.generateRandomNumberWithK();
    const usedKey = await this.getUsedKey(token);
    const isInList = usedKey.includes(newKey);

    if (isInList) {
      await this.changeKey(token);
    } else {
      await this.updateKey(token, newKey);
      await this.addKeyToUsedKeys(token, newKey);
      await this.createHTMLFile("index.html", token, newKey);
      this.log('La clé a bien été changé');
    }
  }

  async updateKey(token, value) {
    const docRef = doc(this.db, 'my-easy-key', token);

    try {
      await updateDoc(docRef, { key: value });
      this.log('la clé a été changé');
    } catch (error) {
      console.error("Erreur lors de la mise à jour de la clé : ", error);
    }
  }

  async addKeyToUsedKeys(token, newKey) {
    const docRef = doc(this.db, 'my-easy-key', token);

    try {
      await updateDoc(docRef, {
        used_key: arrayUnion(newKey)
      });
      this.log('la nouvelle clé a été mise dans la liste des clés déjà utilisées');
    } catch (error) {
      console.error("Erreur lors de l'ajout de la clé : ", error);
    }
  }

  async createHTMLFile(filePath, accessCode, key) {
    const htmlContent = `${key}`;

    fs.writeFile(filePath, htmlContent, async (err) => {
      if (err) {
        console.error('Erreur lors de la création du fichier HTML:', err);
        return;
      }
      this.log('Fichier index.html créé avec succès.');
      await this.uploadFile(filePath, accessCode);
    });
  }

  async checkFileExists(storageRef) {
    try {
      await getDownloadURL(storageRef);
      return true;
    } catch (error) {
      if (error.code === 'storage/object-not-found') {
        return false;
      }
      throw error;
    }
  }

  async updateFileURLInFirestore(accessCode, fileURL) {
    if (typeof accessCode !== 'string') {
      throw new Error('accessCode must be a string');
    }

    const docRef = doc(this.db, 'my-easy-key', accessCode);

    try {
      await updateDoc(docRef, { url: fileURL });
      this.log('URL enregistrée dans Firestore avec succès.');
    } catch (error) {
      console.error('Erreur lors de l\'enregistrement de l\'URL dans Firestore:', error);
    }
  }

  async getWebInfo(accessCode) {
    const docRef = doc(this.db, 'my-easy-key', accessCode);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      const webId = data.web_id;
      const webNumber = data.web_number;
      return { webId, webNumber };
    } else {
      throw new Error('Document does not exist');
    }
  }

  async uploadFile(filePath, accessCode) {
    const { webId, webNumber } = await this.getWebInfo(accessCode);
    const fileName = path.basename(filePath);
    const storageRef = ref(this.storage, `${webId}/${webNumber}/${fileName}`);
    const metadata = {
      contentType: 'text/html',
    };

    try {
      const fileExists = await this.checkFileExists(storageRef);
      if (fileExists) {
        await deleteObject(storageRef);
        this.log('Fichier existant supprimé avec succès.');
      }

      fs.readFile(filePath, async (err, data) => {
        if (err) {
          console.error('Erreur lors de la lecture du fichier:', err);
          return;
        }

        try {
          const snapshot = await uploadBytes(storageRef, data, metadata);
          this.log('Fichier uploadé avec succès!', snapshot);

          const url = await getDownloadURL(storageRef);
          this.log('URL du fichier:', url);

          await this.updateFileURLInFirestore(accessCode, url);
        } catch (uploadError) {
          console.error('Erreur lors de l\'upload du fichier:', uploadError);
        }
      });
    } catch (error) {
      console.error('Erreur lors de la vérification ou de la suppression du fichier:', error);
    }
  }

  async updateUserData(token, field, newValue) {
    const docRef = doc(this.db, 'my-easy-key', token);
    try {
      await updateDoc(docRef, {
        [field]: newValue
      });
    } catch (error) {
      console.error("Erreur lors de la mise à jour du champ :", error);
    }
  }

  async ResetUsedKey(token) {
    const keyInfo = await this.getKeyInformations(token);

    try {
      await this.updateUserData(token, 'used_key', keyInfo.key);
      this.log("Used_key a bien été réinitialisé");
    } catch (error) {
      console.error(error);
    }
  }

  async settings_automatic_update(token, time) {
    const docRef = doc(this.db, 'my-easy-key', "settings");
    try {
      await updateDoc(docRef, {
        [token]: time
      });
      this.log('L\'heure de modification automatique a bien été changée');
    } catch (error) {
      console.error("Erreur lors de la mise à jour du champ :", error);
    }
  }

  async getSettingsData() {
    const docRef = doc(this.db, 'my-easy-key', "settings");
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data();
    } else {
      throw new Error('Document does not exist');
    }
  }

  async checkTime() {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const currentTime = `${hours}H${minutes}`;

    try {
      const data = await this.getSettingsData();
      const matchingKeys = [];

      for (const [key, value] of Object.entries(data)) {
        if (typeof value === 'string' && value === currentTime) {
          matchingKeys.push(key);
        }
      }

      return matchingKeys;
    } catch (error) {
      console.error('Error checking time:', error);
    }
  }

  async initLinkInFirestore(link) {
    const token = await this.getTokenFromURL(link)
    const docRef = doc(this.db, "my-easy-key", token);
    try {
      await updateDoc(docRef, {
        linkvertiseUrl: link
      });
      this.log('Enregistrement du lien linkvertise terminé');
    } catch (error) {
      console.error(error);
    }
  }

  async useLinkvertise(linkvertiseToken, url) {
    try {
      const data = {
        title: 'MEK - Get your key',
        destination: url
      };
      const headers = {
        'Authorization': `Bearer ${linkvertiseToken}`,
        'Content-Type': 'application/json'
      };
  
      const response = await axios.post('https://api.linkvertise.com/api/v1/link', data, { headers });
  
      if (response.status === 201) {
        const linkData = response.data;
        const linkvertiseUrl = linkData.link;
        await this.initLinkInFirestore(linkvertiseUrl)
        this.log(`Votre lien monétisé est : ${linkvertiseUrl}`);
        return linkvertiseUrl
      } else {
        console.error('Erreur lors de la création du lien:', response.data);
      }
    } catch (error) {
      if (error.response) {
        console.error('Erreur de réponse du serveur:', error.response.data);
      } else if (error.request) {
        console.error('Erreur de requête:', error.request);
      } else {
        console.error('Erreur lors de la configuration de la requête:', error.message);
      }
    }
  }
}

module.exports = MyEasyKeyManager;