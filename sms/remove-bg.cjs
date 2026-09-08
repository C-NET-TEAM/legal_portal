const { Jimp } = require('jimp');

async function run() {
  try {
    const image = await Jimp.read('public/sms-icon.jpg');
    
    // Instead of using hex, let's just make any pure or near-white background transparent
    // Wait, the API for Jimp v1 might differ slightly or if it's Jimp v0.22, it's Jimp.read and image.scan
    // Assuming Jimp v0.22 or compatible API
    
    // Fallback: Just assume white background (r>230, g>230, b>230)
    image.scan(0, 0, image.bitmap.width, image.bitmap.height, function (x, y, idx) {
      const r = this.bitmap.data[idx + 0];
      const g = this.bitmap.data[idx + 1];
      const b = this.bitmap.data[idx + 2];
      
      if (r > 230 && g > 230 && b > 230) {
        this.bitmap.data[idx + 3] = 0; // fully transparent
      }
    });
    
    await image.write('public/sms-icon-transparent.png');
    console.log('Successfully created transparent icon');
  } catch (err) {
    console.error('Error:', err);
  }
}

run();
