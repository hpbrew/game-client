import { sat } from "./math"

type CellNode = {
  next: CellNode | null
  prev: CellNode | null
  client: Client
}

type Cells = {
  min: [number, number] | null
  max: [number, number] | null
  nodes: CellNode[][] | null
}

type Client = {
  position: [number, number]
  dimensions: [number, number]
  _cells: Cells
  _queryId: number
}

export class SpatialHashGrid {
  _cells: (null | {
    next: CellNode | null
    prev: CellNode | null
    client: Client
  })[][]
  _dimensions: [number, number]
  _bounds: [[number, number], [number, number]]
  _queryIds: number

  constructor(
    bounds: [[number, number], [number, number]],
    dimensions: [number, number],
  ) {
    const [x, y]: [number, number] = dimensions
    this._cells = [...Array(x)].map((_) =>
      [...Array(y)].map((_) => null as null),
    )
    this._dimensions = dimensions
    this._bounds = bounds
    this._queryIds = 0
  }

  _GetCellIndex(position: [number, number]): [number, number] {
    const x = sat(
      (position[0] - this._bounds[0][0]) /
        (this._bounds[1][0] - this._bounds[0][0]),
    )
    const y = sat(
      (position[1] - this._bounds[0][1]) /
        (this._bounds[1][1] - this._bounds[0][1]),
    )

    const xIndex = Math.floor(x * (this._dimensions[0] - 1))
    const yIndex = Math.floor(y * (this._dimensions[1] - 1))

    return [xIndex, yIndex]
  }

  NewClient(position: [number, number], dimensions: [number, number]): Client {
    const client: Client = {
      position: position,
      dimensions: dimensions,
      _cells: {
        min: null,
        max: null,
        nodes: null,
      },
      _queryId: -1,
    }

    this._Insert(client)

    return client
  }

  UpdateClient(client: Client) {
    const [x, y] = client.position
    const [w, h] = client.dimensions

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    if (!client._cells.min || !client._cells.max) return

    if (
      client._cells.min[0] == i1[0] &&
      client._cells.min[1] == i1[1] &&
      client._cells.max[0] == i2[0] &&
      client._cells.max[1] == i2[1]
    ) {
      return
    }

    this.Remove(client)
    this._Insert(client)
  }

  FindNear(position: [number, number], bounds: [number, number]) {
    const [x, y] = position
    const [w, h] = bounds

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    const clients = []
    const queryId = this._queryIds++

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        let head = this._cells[x][y]

        while (head) {
          const v = head.client
          head = head.next

          if (v._queryId != queryId) {
            v._queryId = queryId
            clients.push(v)
          }
        }
      }
    }
    return clients
  }

  _Insert(client: Client) {
    const [x, y] = client.position
    const [w, h] = client.dimensions

    const i1 = this._GetCellIndex([x - w / 2, y - h / 2])
    const i2 = this._GetCellIndex([x + w / 2, y + h / 2])

    const nodes: CellNode[][] = []

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      nodes.push([])

      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const xi = x - i1[0]

        const head: CellNode = {
          next: null,
          prev: null,
          client: client,
        }

        nodes[xi].push(head)

        const oldHead = this._cells[x][y]
        head.next = oldHead
        if (oldHead) {
          oldHead.prev = head
        }

        this._cells[x][y] = head
      }
    }

    client._cells.min = i1
    client._cells.max = i2
    client._cells.nodes = nodes
  }

  Remove(client: Client) {
    const i1 = client._cells.min
    const i2 = client._cells.max
    if (!i1 || !i2 || !client._cells.nodes) return

    for (let x = i1[0], xn = i2[0]; x <= xn; ++x) {
      for (let y = i1[1], yn = i2[1]; y <= yn; ++y) {
        const xi = x - i1[0]
        const yi = y - i1[1]
        const node = client._cells.nodes[xi][yi]

        if (node.next) {
          node.next.prev = node.prev
        }
        if (node.prev) {
          node.prev.next = node.next
        }

        if (!node.prev) {
          this._cells[x][y] = node.next
        }
      }
    }

    client._cells.min = null
    client._cells.max = null
    client._cells.nodes = null
  }
}
