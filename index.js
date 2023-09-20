#!/usr/bin/env node
const fs = require('fs');
const { createDatabaseIfNotExists, createMigrationFilesFromDb } = require('./utils/primaryDBConnection');
const { createEnv } = require('./utils/userInput');
const { DBConnection } = require('./utils/dbConnection');
const commands = process.argv.filter((item, index) => index > 1)
if (commands[0] == 'create-table') {

    createMigrationFiles(commands, 'createTable')


}
else if (commands[0] == 'update-table') {
    createMigrationFiles(commands, 'updateTable')

}
else if (commands[0] == 'drop-table') {
    createMigrationFiles(commands, 'dropTable')

}

else if (commands[0] == 'migrate') {


    (async () => {
        let dir = process.cwd() + '/migrations'
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let env = require(dir + '/config.json')
        console.log(env)
        await DBConnection.initConnection(env)
        const fileNames = fs.readFileSync(dir + '/index.txt').toString().split('\n')
        if (!fs.existsSync(dir + '/logs.txt')) {
            fs.writeFileSync(dir + '/logs.txt', "")
        }
        const existingList = fs.readFileSync(dir + '/logs.txt').toString().split('\n')
        let existingMap = {}
        for (let existing of existingList) existingMap[existing] = 1
        let executed = existingList.join('\n')
        for (let fileName of fileNames) {
            if (existingMap[fileName] == null) {
                try {
                    await require(dir + `/${fileName}`)()
                    executed += fileName + '\n'


                } catch (error) {
                    console.log(error)
                }

            }

        }

        let writeStream = fs.createWriteStream(dir + '/logs.txt')
        writeStream.write(executed)
        writeStream.close()
        connectionObject.connection.end()
    })()





}

else if (commands[0] == 'create-db') {

    (async () => {
        // if (fs.existsSync('./.git')) {
        //     fs.rmSync(__dirname + '/.git', {
        //         recursive: true,
        //     })
        // }
        let dir = process.cwd() + '/migrations'
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let env = await createEnv(dir)
        console.log(env)
        createDatabaseIfNotExists(env)

    })()


}
else if (commands[0] == 'load-db') {

    (async () => {
        // if (fs.existsSync('./.git')) {
        //     fs.rmSync(__dirname + '/.git', {
        //         recursive: true,
        //     })
        // }
        let dir = process.cwd() + '/migrations'
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        let env = await createEnv(dir)

        createMigrationFilesFromDb(env)
            .then(contents => {
                for (let tableName in contents) {
                    const newFileName = (new Date()) * 1 + "create-table_" + tableName + '.js'

                    if (!fs.existsSync(dir + '/index.txt')) {
                        fs.writeFileSync(dir + '/index.txt', `${newFileName}`)
                        fs.writeFileSync(dir + '/logs.txt', `${newFileName}`)

                    }
                    else {
                        let migratorIndexContents = fs.readFileSync(dir + '/index.txt').toString()
                        fs.writeFileSync(dir + '/index.txt', migratorIndexContents + `\n${newFileName}`)
                        fs.writeFileSync(dir + '/logs.txt', migratorIndexContents + `\n${newFileName}`)

                    }

                    fs.writeFileSync(dir + '/' + newFileName, contents[tableName])

                }
            })
    })()


}
else if (commands[0] == 'clear') {
    let dir = process.cwd() + '/migrations'
    if (fs.existsSync(dir + '/logs.txt')) {
        fs.unlinkSync(dir + '/logs.txt')
    }
}
else if (commands[0] == 'help') {
    console.log("create-db : creates database with the name given in the .env file")
    console.log("load-db : creates migration files from an existing database")
    console.log('create-table <table name>: creates a migration file for creating a table named <table name>')
    console.log('update-table <table name>: creates a migration file for updating a table named <table name>')
    console.log('drop-table <table name>: creates a migration file for dropping a table named <table name>')
    console.log('migrate: runs the migrations')
    console.log('clear: clears the migration history')

}

function createMigrationFiles(commands, type) {
    const newFileName = (new Date()) * 1 + commands[0] + "_" + commands[1] + '.js'
    let dir = process.cwd() + '/migrations'
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
    let templateStr = fs.readFileSync(`./templates/${type}.template.txt`).toString()
    templateStr = templateStr.replace('-', commands[1])

    fs.writeFileSync(dir + '/' + newFileName, templateStr)
    if (!fs.existsSync(dir + '/index.txt')) {
        fs.writeFileSync(dir + '/index.txt', `${newFileName}`)
    }
    else {
        let migratorIndexContents = fs.readFileSync(dir + '/index.txt').toString()
        fs.writeFileSync(dir + '/index.txt', migratorIndexContents + `\n${newFileName}`)

    }
}







