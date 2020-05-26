#!/usr/bin/env node

const pkg = require('./package.json')
const program = require('commander')
const chalk = require('chalk')
const axios = require('axios')
const inquirer = require('inquirer')
const fs = require('fs')

let WIN32_HOST_PATH = null

if (fs.existsSync('C:\\windows\\System32\\drivers\\etc\\hosts.txt')) {
  WIN32_HOST_PATH = 'C:\\windows\\System32\\drivers\\etc\\hosts.txt'
} else if (fs.existsSync('C:\\windows\\System32\\drivers\\etc\\hosts')) {
  WIN32_HOST_PATH = 'C:\\windows\\System32\\drivers\\etc\\hosts'
}

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
    message: '请输入域名缩写名',
  })
  prompts.push({
    type: 'input',
    name: 'hostValue',
    message: '请输入域名',
  })
  return inquirer.prompt(prompts)
}

const select = () => {
  const prompts = []
  const templateChoices = []
  for (let i = 0; i < localStorage.length; i++) {
    templateChoices.push({
      name: localStorage.key(i),
      value: {
        hostKey: localStorage.key(i),
        hostValue: localStorage.getItem(localStorage.key(i)),
      },
    })
  }
  prompts.push({
    type: 'list',
    name: 'host',
    message: '请选择域名',
    choices: templateChoices,
  })
  return inquirer.prompt(prompts)
}

program
  .command('add')
  .description('添加域名到host文件')
  .action(() => {
    ask().then((answers) => {
      localStorage.setItem(answers.hostKey, answers.hostValue)

      getIp(answers.hostKey, answers.hostValue)
    })
  })

program
  .command('use')
  .description('选择域名')
  .action(() => {
    select().then((answers) => {
      getIp(answers.host.hostKey, answers.host.hostValue)
    })
  })

program
  .command('list')
  .description('查看已存在的域名解析')
  .action(() => {
    for (let i = 0; i < localStorage.length; i++) {
      console.log(chalk.green(`${localStorage.key(i)}: ${localStorage.getItem(localStorage.key(i))}`))
    }
  })

program
  .command('look')
  .description('查看host文件')
  .action(() => {
    if (process.platform === 'win32') {
      fs.readFile(WIN32_HOST_PATH, function (err, data) {
        if (err) {
          return console.error(err)
        }
        console.log(chalk.green(data.toString()))
      })
    } else {
      console.log(chalk.red('只支持window系统'))
    }
  })

// 解析域名得到ip
const getIp = (hostKey, hostValue) => {
  axios({
    headers: {
      'Content-Type': 'application/json',
    },
    method: 'get',
    url: `http://119.29.29.29/d?dn=${hostValue}`,
    data: {},
  })
    .then((res) => {
      console.log(chalk.green(res.data))
      if (res.data) {
        let ip = res.data.split(';')[0]

        // 保存ip、域名到host文件
        saveIp(ip, hostValue, hostKey)
      }
    })
    .catch((error) => {
      console.log(chalk.red(error.message))
    })
}

// 保存ip到host文件
const saveIp = (ip, host, key) => {
  if (process.platform !== 'win32') {
    console.log(chalk.red('只支持window系统'))
    return
  }
  fs.readFile(WIN32_HOST_PATH, function (err, data) {
    if (err) {
      return console.error(err)
    }
    let result = data.toString()
    if (result.indexOf(host) > -1) {
      let reg = new RegExp(`#${key}[\\s\\S]*?#${key} end`, 'g')
      result = result.replace(reg, `#${key} start\n${ip} ${host}\n#${key} end`)
    } else {
      result += `\n\n#${key} start\n${ip} ${host}\n#${key} end\n`
    }

    fs.writeFile(WIN32_HOST_PATH, result, 'UTF-8', function (err) {
      if (err) {
        console.log('写域名解析到host文件出错：' + err)
      }
    })
  })
}

program.parse(process.argv)
