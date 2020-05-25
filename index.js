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
      localStorage.setItem(answers.hostKey, answers.hostValue);
    })
  })

program
  .alias('ls')
  .command('list')
  .description('list host url')
  .action(() => {
    for (let i = 0; i < localStorage.length; i++) {
      console.log(chalk.green(`${localStorage.key(i)} ${localStorage.getItem(localStorage.key(i))}`))
    }
  })

program
  .alias('lk')
  .command('look')
  .description('look host file')
  .action(() => {
    if (process.platform === 'win32') {
      fs.readFile('C:\\windows\\System32\\drivers\\etc\\hosts', function (err, data) {
        if (err) {
          return console.error(err)
        }
        console.log(chalk.green(data.toString()))
      })
    }
  })

program.parse(process.argv)
