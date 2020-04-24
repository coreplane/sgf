const t = require('tap')
const path = require('path')
const sgf = require('..')

function getJSON(tree) {
  return JSON.parse(
    JSON.stringify(tree, (key, value) => {
      if (key === 'id' || key === 'parentId') {
        return undefined
      } else if (key == 'children') {
        return value.map(getJSON)
      }

      return value
    })
  )
}

t.test('should parse multiple nodes', t => {
  t.deepEqual(
    getJSON(sgf.parse('(;B[aa]SZ[19];AB[cc][dd:ee])')[0]),
    getJSON({
      data: {B: ['aa'], SZ: ['19']},
      children: [
        {
          data: {AB: ['cc', 'dd:ee']},
          children: []
        }
      ]
    })
  )

  t.end()
})

t.test('should not omit CA property', t => {
  t.deepEqual(
    getJSON(sgf.parse('(;B[aa]CA[UTF-8])', {encoding: 'ISO-8859-1'})[0]),
    getJSON({
      data: {B: ['aa'], CA: ['UTF-8']},
      children: []
    })
  )

  t.end()
})

t.test('should parse variations', t => {
  t.deepEqual(
    getJSON(sgf.parse('(;B[hh](;W[ii])(;W[hi]C[h]))')[0]),
    getJSON({
      data: {B: ['hh']},
      children: [
        {
          data: {W: ['ii']},
          children: []
        },
        {
          data: {W: ['hi'], C: ['h']},
          children: []
        }
      ]
    })
  )

  t.end()
})

t.test('should emit onNodeCreated correctly', t => {
  let nodes = []

  sgf.parse('(;B[hh](;W[ii])(;W[hi];C[h]))', {
    onNodeCreated({node}) {
      nodes.push(JSON.parse(JSON.stringify(node)))
    }
  })

  t.deepEqual(nodes, [
    {
      children: [],
      data: {B: ['hh']},
      id: 0,
      parentId: null
    },
    {
      children: [],
      data: {W: ['ii']},
      id: 1,
      parentId: 0
    },
    {
      children: [],
      data: {W: ['hi']},
      id: 2,
      parentId: 0
    },
    {
      children: [],
      data: {C: ['h']},
      id: 3,
      parentId: 2
    }
  ])

  t.end()
})

t.test('should convert lower case properties', t => {
  t.deepEqual(
    getJSON(
      sgf.parse('(;CoPyright[hello](;White[ii])(;White[hi]Comment[h]))')[0]
    ),
    getJSON({
      data: {CP: ['hello']},
      children: [
        {
          data: {W: ['ii']},
          children: []
        },
        {
          data: {W: ['hi'], C: ['h']},
          children: []
        }
      ]
    })
  )

  t.end()
})

t.test('should be able to parse nodes outside a game', t => {
  let trees1 = sgf.parse(';B[hh];W[ii]')
  let trees2 = sgf.parse('(;B[hh];W[ii])')

  t.deepEqual(trees1, trees2)
  t.end()
})

t.test('should be able to correctly parse a game that misses initial ;', t => {
  let trees1 = sgf.parse('B[hh];W[ii]')
  let trees2 = sgf.parse('(B[hh];W[ii])')
  let trees3 = sgf.parse('(;B[hh];W[ii])')

  t.deepEqual(trees1, trees3)
  t.deepEqual(trees2, trees3)
  t.end()
})

t.test('should ignore empty variations', t => {
  t.deepEqual(
    getJSON(sgf.parse('(;B[hh]()(;W[ii])()(;W[hi]C[h]))')[0]),
    getJSON({
      data: {B: ['hh']},
      children: [
        {
          data: {W: ['ii']},
          children: []
        },
        {
          data: {W: ['hi'], C: ['h']},
          children: []
        }
      ]
    })
  )

  t.end()
})
