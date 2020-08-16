import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

const BUCKET_NAME_PREF = "gs://hack20-52610.appspot.com/";

export async function getImageLabel(object : functions.storage.ObjectMetadata) {
  if (!object.contentType!.includes('image')) {
    return;
  }

  const m : Map<string, number> = new Map();
  let tags : string[] = [];

  const url = BUCKET_NAME_PREF + object.name;

  // Imports the Google Cloud client library
  const vision = require('@google-cloud/vision');

  // Creates a client
  const client = new vision.ImageAnnotatorClient();

  // Performs label detection on the image file
  const [result] = await client.labelDetection(url);
  const labels = result.labelAnnotations;
  console.log('Labels:');
  // labels.forEach((label : any) => m.set(label.description, label.score));
  labels.forEach((label : any) => {
    tags.push(label.description);
    m.set(label.description, label.score);
  });

  const tagMapping = Array.from(m).reduce((obj, [key, value]) => (
    Object.assign(obj, { [key]: value })
  ), {});

  await admin.firestore().collection('images').add({
    'tags' : tags,
    'url' : url,
    'tagscores' : tagMapping
  });

  return;
}