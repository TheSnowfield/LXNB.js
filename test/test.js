const assert = require('assert')
const stream = require('stream')
const util = require('util')

const nextTick = util.promisify(process.nextTick)
const lxnb = require('../lxnb')

describe('LXNB', function() {
  it('should encode', function() {
    assert.strictEqual(lxnb.encode(new Uint8Array([114, 99, 110, 98])), 'ɫ̂ńƁꞭҳņÞ')
    assert.strictEqual(lxnb.encode(new Uint8Array([222, 233, 111, 122, 222])), 'ȵßŁẋɫxńÞƞƃ')
    assert.strictEqual(lxnb.encode(new TextEncoder('utf-8').encode('Who NB?')), 'ḽχŃƅꞭӿƞÞḽxƝƃľx')
  })
  
  it('should decode', function() {
    assert.deepStrictEqual(lxnb.decode('ɫ̂ńƁꞭҳņÞ'), new Uint8Array([114, 99, 110, 98]))
    assert.deepStrictEqual(lxnb.decode('ȵßŁẋɫxńÞƞƃ'), new Uint8Array([222, 233, 111, 122, 222]))
    assert.strictEqual(new TextDecoder("utf-8").decode(lxnb.decode('ḼχŅƃḽxƝƃLᚸ')), 'LXNB!')
  })

  it('should error', async function() {
    // length & 1 == true
    assert.throws(() => lxnb.decode('ĹxńƁⱡḼņ'))

    // not LXNB
    assert.throws(() => lxnb.decode('lĹńƁ'))
    assert.throws(() => lxnb.decode('BxńƁ'))

    // overflow
    assert.throws(() => lxnb.decode('ĺӿȵþ'))
    assert.throws(() => lxnb.decode('ĺӿ'))
    assert.throws(() => lxnb.decode('ȵþ'))
  })
})

describe('LXNB stream', function() {
  async function waitAndRead(stream, arr) {
    await nextTick()
    arr.push(stream.read())
  }

  it('should encode from stream (partial)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.encodeStream())
    output.setEncoding('utf-8')

    let results = []
    input.push(Buffer.of(222, 233))
    await waitAndRead(output, results)

    assert.strictEqual(results.join(''), 'ȵßŁẋ')
  })

  it('should encode from stream (2+3)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.encodeStream())
    output.setEncoding('utf-8')

    let results = []
    input.push(Buffer.of(222, 233))
    await waitAndRead(output, results)
    input.push(Buffer.of(111, 122, 222))
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    assert.strictEqual(results.join(''), 'ȵßŁẋɫxńÞƞƃ')
  })

  it('should encode from stream (3+2)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.encodeStream())
    output.setEncoding('utf-8')

    let results = []
    input.push(Buffer.of(222, 233, 111))
    await waitAndRead(output, results)
    input.push(Buffer.of(122, 222))
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    assert.strictEqual(results.join(''), 'ȵßŁẋɫxńÞƞƃ')
  })

  it('should encode from stream (1+1+1+1+1)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.encodeStream())
    output.setEncoding('utf-8')

    let results = []
    input.push(Buffer.of(222))
    await waitAndRead(output, results)
    input.push(Buffer.of(233))
    await waitAndRead(output, results)
    input.push(Buffer.of(111))
    await waitAndRead(output, results)
    input.push(Buffer.of(122))
    await waitAndRead(output, results)
    input.push(Buffer.of(222))
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    assert.strictEqual(results.join(''), 'ȵßŁẋɫxńÞƞƃ')
  })

  it('should encode from stream 2', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.encodeStream())
    output.setEncoding('utf-8')

    let results = []
    input.push(Buffer.from(new TextEncoder('utf-8').encode('Who')))
    await waitAndRead(output, results)
    input.push(Buffer.from(new TextEncoder('utf-8').encode(' NB?')))
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    assert.strictEqual(results.join(''), 'ḽχŃƅꞭӿƞÞḽxƝƃľx')
  })
  
  it('should decode from stream (2+3)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.decodeStream())

    let results = []
    input.push(Buffer.from('ȵßŁẋ', 'utf-8'))
    await waitAndRead(output, results)
    input.push('ɫxńÞƞƃ')
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    results = results.filter(n => n) // remove null results
    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })

  it('should decode from stream (2.5+2.5)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.decodeStream())

    let results = []
    input.push(Buffer.from('ȵßŁẋɫ', 'utf-8'))
    await waitAndRead(output, results)
    input.push('xńÞƞƃ')
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    results = results.filter(n => n) // remove null results
    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })

  it('should decode from stream (3+2)', async function() {
    let input = new stream.Readable
    input._read = () => {}

    let output = input.pipe(lxnb.decodeStream())

    let results = []
    input.push('ȵßŁẋɫx')
    await waitAndRead(output, results)
    input.push('ńÞƞƃ')
    input.push(null) // indicates EOF
    await waitAndRead(output, results)

    results = results.filter(n => n) // remove null results
    assert.deepStrictEqual(Buffer.concat(results), Buffer.of(222, 233, 111, 122, 222))
  })
})