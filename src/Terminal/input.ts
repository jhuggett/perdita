

export enum Keys {
  a = '97',
  A = '65',
  b = '98',
  B = '66',
  c = '99',
  C = '67',
  d = '100',
  D = '68',
  e = '101',
  E = '69',
  f = '102',
  F = '70',
  g = '103',
  G = '71',
  h = '104',
  H = '72',
  i = '105',
  I = '73',
  j = '106',
  J = '74',
  k = '107',
  K = '75',
  l = '108',
  L = '76',
  m = '109',
  M = '77',
  n = '110',
  N = '78',
  o = '111',
  O = '79',
  p = '112',
  P = '80',
  q = '113',
  Q = '81',
  r = '114',
  R = '82',
  s = '115',
  S = '83',
  t = '116',
  T = '84',
  u = '117',
  U = '85',
  v = '118',
  V = '86',
  w = '119',
  W = '87',
  x = '120',
  X = '88',
  y = '121',
  Y = '89',
  z = '122',
  Z = '90',

  One = '49',
  Two = '50',
  Three = '51',
  Four = '52',
  Five = '53',
  Six = '54',
  Seven = '55',
  Eight = '56',
  Nine = '57',
  Zero = '48',

  Escape = '27',
  Tab = '9',
  Space = '32',
  Enter = '13',
  Backspace = '8',
  Delete = '127',

  PlusSign = '43',
  MinusSign = '45',

  ArrowUp = '27|91|65',
  ArrowRight = '27|91|67',
  ArrowDown = '27|91|66',
  ArrowLeft = '27|91|68',
}

const reactToKeyPress = async () : Promise<Buffer> => {
  process.stdin.setRawMode(true)
  process.stdin.resume()
  return new Promise((resolve) => {
    return process.stdin.once('data', (data) => {
      process.stdin.pause()
      resolve(data)
      })
  })
}

export function buildTarget(keys: Keys[]) {
  return keys.map(key => key.valueOf()).join(',')
}

interface Target<T> {
  key: string
  call:  T
}

interface InputProps<T> {
  targets: Target<T>[]
  catchAll?: (raw: Buffer) => T
}

export const target = <T = void>(key: string, call: T) : Target<T> => ({
  key,
  call
})

export class NoMatchingTarget extends Error {}

export async function input<T = void>({
  targets,
  catchAll
} : InputProps<T>) : Promise<T> {
    const rawInput = await reactToKeyPress()

    let key: string[] = []
    let i = 0
    while (rawInput[i]) {
      key.push(rawInput[i].toString())
      i++
    }
    const formattedKey = key.join('|')

    for (const target of targets) {
      if (target.key === formattedKey) {
        return target.call
      }
    }

    if (catchAll) {
      return catchAll(rawInput)
    }


    throw new NoMatchingTarget('No matching target')
}

export async function keypress() {
  try {
    await input({
      targets: []
    })
  } catch {}
}