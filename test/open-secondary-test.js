'use strict'

const test = require('tape')
const leveldown = require('..')
const tempy = require('tempy')

const location = tempy.directory()
const secondLocation = tempy.directory()

function factory () {
  return leveldown(location)
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

test('test read from secondary db after write to primary db', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      db.put('my key', 'my value', function (err) {
        t.ifError(err, 'no error from put()')

        db.get('my key', function (err, value) {
          t.ifError(err, 'no error from get()')
          t.equal(value.toString(), 'my value', 'correct value')
          db.close(t.end.bind(t))
        })

        secondDb.get('my key', function (err, value) {
          t.ifError(err, 'no error from secondary get()')
          t.equal(value.toString(), 'my value', 'correct value')
          secondDb.close(t.end.bind(t))
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
    secondDb.open({ secondary: true, secondaryLocation: secondLocation }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      secondDb.put('my key', 'my value', function (err) {
        t.ok(err, 'should get write error')
        secondDb.close(t.end.bind(t))
        db.close(t.end.bind(t))
      })
    })
  })
})

test('test throw error deleting data to secondary db if secondary is true', function (t) {
  const db = factory()

  db.open(function (err) {
    t.ifError(err, 'no error from open()')

    const secondDb = factory()
    secondDb.open({ secondary: true, secondaryLocation: secondLocation }, function (err) {
      t.ifError(err, 'no error from open secondary db()')

      secondDb.del('my key', function (err) {
        t.ok(err, 'should get write error')
        secondDb.close(t.end.bind(t))
        db.close(t.end.bind(t))
      })
    })
  })
})
