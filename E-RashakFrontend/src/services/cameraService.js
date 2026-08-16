import api from './api'

export async function getCameras() {
  const res = await api.get('/cameras')
  return res.data
}

export async function updateCameraStatus(cameraId, status) {
  const res = await api.put(`/cameras/${cameraId}`, { status })
  return res.data
}
