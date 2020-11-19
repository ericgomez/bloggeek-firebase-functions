const { UsuarioAdmin } = require('./UsuarioAdmin.js')

//Cuando se crea el usuario envia un correo de bienvenida 
exports.usuarioCreacionController = usuario => {
  const usuarioAdmin = new UsuarioAdmin()

  return usuarioAdmin
  //metodo enviarEmailBienvenida
    .enviarEmailBienvenida(usuario.displayName, usuario.email)
    .then(() => {
      return usuarioAdmin.registrarEmailsUsuario(
        usuario.displayName,
        usuario.email
      )
    })
    .catch(error => {
      console.error(`Error en la creación de usuario => ${error}`)
    })
}

//Cuando se elimina el usuario envia un correo de despedida 
exports.usuarioEliminadoController = usuario => {
  const usuarioAdmin = new UsuarioAdmin()

  return usuarioAdmin
  //metodo enviarEmailDespedida
    .enviarEmailDespedida(usuario.displayName, usuario.email)
    .catch(error => {
      console.error(`Error en la creación de usuario => ${error}`)
    })
}

exports.creacionUsuarioCRM = usuario => {
  const usuarioAdmin = new UsuarioAdmin()
  return usuarioAdmin.sincronizarCRM(
    usuario.displayName,
    usuario.displayName,
    usuario.email
  )
}
