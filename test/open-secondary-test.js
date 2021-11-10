'use strict'

const test = require('tape')
const leveldown = require('..')
const tempy = require('tempy')

const location = tempy.directory()
const secondLocation = tempy.directory()

function factory () {
  return leveldown(location)
}

function closeBothDb (db, secondDb, t) {
  secondDb.close(function (err) {
    t.ifError(err, 'no error from close()')
    db.close(t.end.bind(t))
  })
}

test('test write to read/write database', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    db.put('my key', 'my value', function (err) {
      t.ifError(err, 'no error from put()')
      db.get('my key', function (err, value) {
        t.ifError(err, 'no error from get()')
        t.equal(value.toString(), 'my value', 'correct value')
        db.close(t.end.bind(t))
      })
    })
  })
})

test('throw error when secondary db open without maxOpenFiles set to -1', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation }, function (err) {
      t.ok(err, 'should get open error')
      t.ok(/Invalid argument: require max_open_files to be -1/i.test(err && err.message), 'should get open error')
      db.close(t.end.bind(t))
    })
  })
})

test('test read from secondary db after write to primary db', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation, maxOpenFiles: -1 }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      db.put('my key', 'my value', function (err) {
        t.ifError(err, 'no error from put()')

        db.get('my key', function (err, value) {
          t.ifError(err, 'no error from get()')
          t.equal(value.toString(), 'my value', 'correct value')

          secondDb.get('my key', function (err, value) {
            t.ifError(err, 'no error from secondary get()')
            t.equal(value.toString(), 'my value', 'correct value')

            closeBothDb(db, secondDb, t)
          })
        })
      })
    })
  })
})

test('test throw error putting data to secondary db if secondary is true', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation, maxOpenFiles: -1 }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      secondDb.put('my key', 'my value', function (err) {
        t.ok(err, 'should get write error')
        t.ok(/Not implemented: Not supported operation in secondary mode./i.test(err && err.message), 'should get error')
        closeBothDb(db, secondDb, t)
      })
    })
  })
})

test('test throw error deleting data to secondary db if secondary is true', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation, maxOpenFiles: -1 }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      secondDb.del('my key', function (err) {
        t.ok(err, 'should get write error')
        t.ok(/Not implemented: Not supported operation in secondary mode./i.test(err && err.message), 'should get error')
        closeBothDb(db, secondDb, t)
      })
    })
  })
})
