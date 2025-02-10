import fs from 'fs'
import path from 'path'
import { BUCKETS } from '../../env'

const saveFile = ({ filePath, destinationPath, destBucket }) => {
  try {
    const bucket = BUCKETS[destBucket]
    if (bucket === undefined) {
      return {
        error: true,
        data: 'El bucket no existe',
      }
    }
    const fileBuffer = fs.readFileSync(filePath)
    const destination = path.join(bucket, destinationPath)
    fs.existsSync(destination) && fs.unlinkSync(destination)
    fs.writeFileSync(destination, fileBuffer)
    return { error: false, data: [destBucket, destinationPath].join('/') }
  } catch (error) {
    return {
      error: true,
      message: 'Error al guardar el archivo',
      data: error.toString(),
    }
  }
}

module.exports = { saveFile }
