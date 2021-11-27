// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
const net = require('net')
const fs = require('fs') 
const os = require('os')
const path = require('path')

// global variable
var sendFilePath, server = null

window.addEventListener('DOMContentLoaded', () => {
  const replaceText = (selector, text) => {
    const element = document.getElementById(selector)
    if (element) element.innerText = text
  }

  for (const type of ['chrome', 'node', 'electron']) {
    replaceText(`${type}-version`, process.versions[type])
  }

  // geting dom objects 
  sendFilepathInput = document.getElementById('file-path-input')
  sendBtn = document.getElementById('send-button')
  ipAddress = document.getElementById('ip-address')

  ipAddressInput = document.getElementById('ip-address-input')
  receaveFilePathInput = document.getElementById('receave-filepath-input')
  receaveBtn = document.getElementById('receave-button')

  sendBtn.addEventListener('click',()=>{
    // check if input file path is currect - done
    // create file stream
    // create server
    // abstract this into a function

    // get file path input from input field
    sendFilePath = sendFilepathInput.value
    if(!sendFilePath){
      console.log('file path not added')
      alert('Please enter a file path...')
      return
    }
    // validate file path
    let isFileExists = fs.existsSync(sendFilePath) && fs.lstatSync(sendFilePath).isFile()
    if(isFileExists){
      console.log('file path is all set...')
      console.log(sendFilePath)
    }else{
      alert('Please enter a valied file path...')
      sendFilepathInput.value = ''
    }

    // get ip address
    const networkInterface = os.networkInterfaces()
    try {
      var ip = JSON.stringify(networkInterface["Wi-Fi"][0].address)
      ipAddress.innerText = ip
    } catch (error) {
      console.log('error, probably wifi is off', error)
      alert('connect yorur device to wifi or enable hotspot')
      return
    }

    // close previous server
    if(server){
      server.close()
      console.log('server distroyed successfully...')
    }

    // create server with server handler
    server = net.createServer(serverHandler).listen(9000, ()=>{
      console.log('started succcessfully')
    })
  })


  receaveBtn.addEventListener('click',()=>{
    console.log('receave clicked')
    var downloadPath = receaveFilePathInput.value
    // validate ip address
    if(!ValidateIPaddress(ipAddressInput.value)){
      alert('Incorrect ip address... please re-enter...')
      return
    }
    if(!isValiedDirectory(downloadPath)){
      alert('input file path is not valied...')
    }
    var serverIp = ipAddressInput.value
    var serverPort = 9000

    var client = new net.Socket()
    client.on('error',()=>{
      console.log('error')
    })
    client.once('close', ()=>{
      console.log('connection clossed')
    })
    client.once('data',(data)=>{
      client.on('data',(data)=>{
          console.log('buffer receaved')
          writeStream.write(data)
      })
      var stringData = data.toString('ascii')
      var jsonData = JSON.parse(stringData)
      console.log(jsonData.fileName, jsonData.fileSize)
      // create write stream
      if(downloadPath.substr(-1)!= '\\'){
        downloadPath += '\\'
      }
      var writeStream = fs.createWriteStream(downloadPath+path.basename(jsonData.fileName))
      console.log('writestream created....')
      console.log('event listner added')
      client.write('1')
    })
    client.connect(serverPort,serverIp,()=>{
      console.log("connection is made")
    })   
  })

})


function serverHandler(socket){
  // log ip and port of connected device
  var remoteAddress = socket.remoteAddress +":"+ socket.remotePort
  console.log(`server listening to ${remoteAddress}`)
  
  // creaete readstream
  readStream = fs.createReadStream(sendFilePath)
  console.log('read steram created')

  // get file size
  var fileSize = fs.statSync(sendFilePath).size
  // create wright stream at client
  wrightStreamData = {fileName:sendFilePath, fileSize:fileSize}
  socket.write(JSON.stringify(wrightStreamData))
  console.log('Wright stream data sent...')
  
  // wait for client setup
  socket.on("data", (data)=>{
      console.log(data.length)
      var receavedData = data.toString('ascii')
      if(receavedData== 1){
          // if client replay with 1 start file transfer
          
          console.log("ready to start .........")
          readStream.on('readable',()=>{
              let data
              while (data=readStream.read()){
                  socket.write(data)
              }
              
          })
          // transfer compleation
          readStream.on('end',()=>{
              console.log('transfer compleated')
              alert('transfer compleated')
          })
      }else if(receavedData== 0){
          // custom error 
          console.log('error occourd....')
      }
      else{
          // Replay message handling
          console.log(receavedData)
      }
  })
  
  // error handling
  socket.on("error", (err)=>{
      console.log("error happend in connection")
      console.log(err)
  })
  
  // clossing server and socket
  socket.once("close", ()=>{
      console.log('connection clossed')
  })
}

function ValidateIPaddress(ipaddress) {  
  if (/^(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.(25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/.test(ipaddress)) {  
    return (true)  
  }  
  return (false)  
}  

function isValiedDirectory(dir) {
  return fs.existsSync(dir) && true
}
//npx electron-packager  .  -- platform=win32 --electronZipDir=C:/Users/baruc/AppData/Local/electron/Cache/787878 --overwrite=force