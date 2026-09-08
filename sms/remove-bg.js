const Jimp = require('jimp');

async function run() {
  try {
    const image = await Jimp.read('public/sms-icon.jpg');
    
    const hex = image.getPixelColor(0, 0);
    const rgba = Jimp.intToRGBA(hex);
    
    // Basic flood fill approach or color replacement based on the corner color
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      const tolerance = 30; // 30 units of color difference
      if (Math.abs(r - rgba.r) <= tolerance && Math.abs(g - rgba.g) <= tolerance && Math.abs(b - rgba.b) <= tolerance) {
        this.bitmap.data[idx + 3] = 0; // fully transparent
      }
    });
    
    // We write to png so transparency is preserved
    await image.writeAsync('public/sms-icon-transparent.png');
    console.log('Successfully created transparent icon');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
