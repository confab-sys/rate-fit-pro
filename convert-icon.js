import sharp from 'sharp';

// Create a simple colored square
sharp({
  create: {
    width: 512,
    height: 512,
    channels: 4,
    background: { r: 13, g: 27, b: 42, alpha: 1 }
  }
})
.png()
.toFile('public/icon-512.png')
.then(() => {
  console.log('Basic icon created successfully!');
})
.catch(err => {
  console.error('Error creating icon:', err);
}); 