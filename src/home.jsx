import React, { useState } from 'react';
import { Box, Typography, Button, CircularProgress } from '@mui/material';
import axios from 'axios';

import emo from './images/emotix.png';
import { grey } from '@mui/material/colors';

const Home = () => {
  const [image, setImage] = useState(null);
  const [prediction, setPrediction] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPrediction(null);  // Clear previous predictions
      setError(null);        // Clear previous error
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();

    if (!image) {
      setError('Silahkan pilih gambar terlebih dahulu');
      return;
    }

    const formData = new FormData();
    formData.append('file', image);
    setLoading(true);  

    try {
      const response = await axios.post('http://127.0.0.1:5000/predict', formData, {
        // headers: {
        //   'Content-Type': 'multipart/form-data',
        // },
      });

      if (response.data.prediction) {
        setPrediction(response.data.prediction);
      } else {
        setError(response.data.error || 'Unknown error');
      }
    } catch (err) {
      setError('Terjadi error ketika upload gambar.');
    } finally {
      setLoading(false);  // Stop loading state after the API call finishes
    }
  };

  return (
    <div className="snap-emodetect" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px'}}>
        <img src={emo} height={100} />
      <Typography variant='h5'>Deteksi Ekspresi Wajah</Typography>
      {!image && (
        <Box sx={{
          width: 300,
          height: 100,
          borderRadius: 2,
          boxSizing: 'border-box',
          border: '2px dashed #EBAC00',
          display: 'flex',
          padding: '30px', 
          marginTop: '20px',
          color: grey[500],
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative' }} bgcolor={ '#FFF3D1' }>
              <input type="file" onChange={handleImageChange} accept="image/*" style={{
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  alignContent: 'center',
                  position: 'absolute',
                  opacity: 0,
              }} />
              Upload gambar
          </Box>
      )}
      {imagePreview && (
          <Box sx={{ marginTop: '20px', width: 224, height: 224, border: '1px solid #ddd' }}>
              <img src={imagePreview} alt="Selected Preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          </Box>
      )}
      <div style={{ display: 'flex', flexDirection: 'row', gap: '20px'}}>
        <Button style={{ backgroundColor: '#FF8A9B', color: 'white', padding: '0 15px'}} onClick={handleUpload} disabled={loading}>Deteksi</Button>
        <Button
          variant="outlined"
          style={{ color: '#FF8A9B', borderColor: '#FF8A9B'}}
          onClick={() => {
            setImage(null);
            setImagePreview(null);
            setPrediction(null);
            setError(null);
          }}
          >
          Hapus
        </Button>
      </div>
      {loading && <CircularProgress sx={{ marginTop: '20px' }} />}
      {prediction && <h5>Prediksi Ekspresi: {prediction}</h5>}
      {error && <h5 style={{ color: 'red' }}>{error}</h5>}
    </div>
  );
};

export default Home;