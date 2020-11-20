const admin = require('firebase-admin')
const functions = require('firebase-functions')
const path = require('path')
const os = require('os')
const fs = require('fs')
const vision = require('@google-cloud/vision')
const { Email } = require('./../utilidad/EmailHelper.js')
const plantillas = require('./../utilidad/PlantillasEmail.js')
const { Notificaciones } = require('./../notificaciones/Notificaciones.js')
const { post } = require('request')

class Posts {
  registrarAuditoria (idPost, nuevoPost, viejoPost) {
    // Reto
  }

  validarImagenPost (archivo) {

    const ruraArchivo = archivo.name
    const nombreArchivo = path.basename(rutaArchivo)
    const idPost = path.basename(rutaArchivo).split('.')[0]
    const bucket = admin.storage.bucket()
    const tmpRutaArchivo = path.join(os.tmpdir(), nombreArchivo)

    const cliente  = new vision.Image.ImageAnnotatorClient()

    return bucket
      .file(rutaArchivo)
      .download({
        destination : tmpRutaArchivo
      })
      .then(() => {
        return cliente.safeSearchDetection(tmpRutaArchivo)
      })
      .then(resultado => {
        const adulto = resultado[0].safeSearchAnnotation.adult
        const violence = resultado[0].safeSearchAnnotation.violence
        const medical = resultado[0].safeSearchAnnotation.medical
        
        return (
          this.esAdecuada(adulto) &&
          this.esAdecuada(medical) &&
          this.esAdecuada(violence)
        )
      })
      .then(resp =>{
        if (resp) {//Si la imagen es apropiada cambiamos el estado para que se publique
          this.actualizarEstadoPost(idPost, true)
          return resp
        }
        //En caso de que la imagen no sea  apropiada le mandamos un mensaje al usuario
        return this.enviarNotRespImagenInapropiada(idPost)
      })
  }
  
  //Utilizamos este metodo para validar que resultado tiene la imagen
  esAdecuada (resultado) {
    return (
      resultado !== 'POSSIBLE' &&
      resultado !== 'LIKELY' &&
      resultado !== 'VERY_LIKELY'
    )
  }

  actualizarEstadoPost (idPost, estado) {
    const refAuditoria = admin
      .firestore()
      .collection('posts')
      .doc(idPost)

    return refAuditoria.update({
      publicado: estado
    })
  }

  enviarNotRespImagenInapropiada (idPost) {
    console.log(`Consultar Token idPost => ${idPost}`)

    return admin
      .firestore()
      .collection('posts')
      .doc(idPost)
      .get()
      .then(post => {
        console.log(post)
        if (post.data().token !== null && post.data().token !== undefined) {
          console.log(`idPost token => ${post.data().token}`)
          const notificaciones = new Notificaciones()
          notificaciones.enviarNotificacionAToken(
            'Posts con imagen no permitida',
            'Tu post no se puede mostrar ya que la imagen no es permitida',
            'notvalidacionimagen',
            post.data().token
          )
        }

        return post
      })
  }

  enviarPostSemana (topicoNotificacion) {
    const fechaFin = new Date()
    const fechaInicial = new Date()
    fechaInicial.setDate(fechaFin.getDate() - 5)
    let emails = ""

    return admin
      .firestore()
      .collection('emailsusuarios')
      .get()
      .then(emailsusuarios => {
        emailsusuarios.forEach(emailUsuarios => {
          emails += '${emailUsuario.data().email}'
        })
        return emails
      })
      .then(() => {
        return admin
          .firestore()
          .collection('posts')
          .where('fecha', '>=', fechaInicial)
          .where('fecha', '<=', fechaFin)
          .where('publicado', '==', true)
          .get()
      })
      .then(posts => {
        //Si el post es diferente de vacio
        if (!posts.empty) {
          const textHtml = plantillas.plantillaVideosLaSemana(posts)
          const objEmail = new Email()

          return objEmail.sendEmail(
            'info@blogeek.co',
            emails,
            "",
            "Video Blogeek - Los videos geek de la semana",
            textHtml
          )
        }
        //En caso de que no exista un post retornamos un null
        return null
      })
  }
}

exports.Posts = Posts
