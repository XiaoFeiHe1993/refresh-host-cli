#!/usr/bin/env node

const pkg = require('./package.json')
const program = require('commander')
const colors = require('colors')
const chalk = require('chalk')
const path = require('path')
const axios = require('axios')
const inquirer = require('inquirer')
const fs = require('fs')

let localStorage = null
if (typeof localStorage === 'undefined' || localStorage === null) {
  var LocalStorage = require('node-localstorage').LocalStorage
  localStorage = new LocalStorage('./scratch')
}

program.usage('[command] [options]').version(pkg.version)

const ask = () => {
  const prompts = []
  prompts.push({
    type: 'input',
    name: 'hostKey',
    message: 'please input host key',
  })
  prompts.push({
    type: 'input',
    name: 'hostValue',
    message: 'please input host value',
  })
  return inquirer.prompt(prompts)
}

program
  .alias('a')
  .command('add')
  .description('add url to host file')
  .action(() => {
    ask().then((answers) => {
      localStorage.setItem(answers.hostKey, answers.hostValue)

      // 解析域名得到对应ip
      axios({
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'get',
        url: `http://119.29.29.29/d?dn=${answers.hostValue}`,
        data: {},
      })
        .then((res) => {
          console.log(chalk.green(res.data))
          if (res.data) {
            let ip = res.data.split(';')[0]

            // 保存ip、域名到host文件
            saveIp(ip, answers.hostValue, answers.hostKey)
          }
        })
        .catch((error) => {
          console.log(chalk.red(error.message))
        })
    })
  })

program
  .alias('ls')
  .command('list')
  .description('list host url')
  .action(() => {
    for (let i = 0; i < localStorage.length; i++) {
      console.log(chalk.green(`${localStorage.key(i)}: ${localStorage.getItem(localStorage.key(i))}`))
    }
  })

program
  .alias('lk')
  .command('look')
  .description('look host file')
  .action(() => {
    if (process.platform === 'win32') {
      fs.readFile('C:\\windows\\System32\\drivers\\etc\\hosts.txt', function (err, data) {
        if (err) {
          return console.error(err)
        }
        console.log(chalk.green(data.toString()))
      })
    }
  })

const saveIp = (ip, host, key) => {
  fs.readFile('C:\\windows\\System32\\drivers\\etc\\hosts.txt', function (err, data) {
    if (err) {
      return console.error(err)
    }
    let result = data.toString()
    if (result.indexOf(host) > -1) {
      let reg = new RegExp(`#${key}[\\s\\S]*?#${key} end`, 'g')
      result = result.replace(reg, `#${key} start\n${ip} ${host}\n#${key} end\n`)
    } else {
      result += `\n\n#${key} start\n${ip} ${host}\n#${key} end\n`
    }

    fs.writeFile('C:\\windows\\System32\\drivers\\etc\\hosts.txt', result, 'UTF-8', function (err) {
      if (err) {
        console.log('写文件出错了：' + err)
      }
    })
  })
}

program.parse(process.argv)
