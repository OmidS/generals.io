import { expect } from 'chai'
<<<<<<< HEAD:src/computableGameInformation/getPossibleOrders/getPossibleOrders.spec.ts
import sampleFirstTurnVisibleGameInformation from '../../sampleFirstTurnVisibleGameInformation'
import { Order, GameState } from '../../types'
import GameConfiguration from '../../GameConfiguration'
import createGameState from '../../GameState'
import getPossibleOrders from './index'
=======
import { sampleFirstTurnVisibleGameInformation, sampleSecondTurnVisibleGameInformation }  from '../sampleVisibleGameInformation'
import { getPossibleOrders, getNonsplittingTileOrders, stepAway } from './index'
import { Order, GameState } from '../types'
import GameConfiguration from '../GameConfiguration'
import createGameState from '../GameState'
>>>>>>> 069d7a8... added the step away function in strategy:src/Strategy/Strategy.spec.ts


describe('getPossibleOrders', () => {
  it('returns an array of possble orders given the game state and game configuration', () => {
    const gameConfiguration: GameConfiguration = new GameConfiguration('Anonymous', sampleFirstTurnVisibleGameInformation)
    const gameState: GameState = createGameState(gameConfiguration, sampleFirstTurnVisibleGameInformation)
    const possibleOrders: Order[] = getPossibleOrders({ config: gameConfiguration, state: gameState })
    expect(possibleOrders).to.be.an('array')
    expect(possibleOrders).to.have.length(2)
    expect(possibleOrders).to.deep.equal([
      {
        splitArmy: false,
        from: { rowIndex: 0, colIndex: 0 },
        to: { rowIndex: 1, colIndex: 0 },
      },
      {
        from: { rowIndex: 0, colIndex: 0 },
        to: { rowIndex: 1, colIndex: 0 },
        splitArmy: true
      }
    ])
  })
})


describe('getNonsplittingTileOrders', () => {
  it('returns an array of possble orders given a specific tile, the game state, and game configuration', () => {
    const gameConfiguration: GameConfiguration = new GameConfiguration('Anonymous', sampleFirstTurnVisibleGameInformation)
    const gameState: GameState = createGameState(gameConfiguration, sampleFirstTurnVisibleGameInformation)
    const tile = gameConfiguration.revealed.grid[0][0]
    const possibleTileOrders: Order[] = getNonsplittingTileOrders(gameConfiguration, gameState,tile)
    expect(possibleTileOrders).to.be.an('array')
    expect(possibleTileOrders).to.have.length(1)
    expect(possibleTileOrders).to.deep.equal([
      {
        splitArmy: false,
        from: { rowIndex: 0, colIndex: 0 },
        to: { rowIndex: 1, colIndex: 0 },
      }
    ])
    const otherTile = gameConfiguration.revealed.grid[1][1]
    const possibleOtherTileOrders: Order[] = getNonsplittingTileOrders(gameConfiguration, gameState, otherTile)
    expect(possibleOtherTileOrders).to.be.an('array')
    expect(possibleOtherTileOrders).to.have.length(0)
  })
})

describe('stepAway', () => {
  it('returns an order for a tile given gameState, gameConfiguration, the specified tile, and an origin tile', () =>{
    const gameConfiguration: GameConfiguration = new GameConfiguration('Anonymous', sampleFirstTurnVisibleGameInformation)
    const gameState: GameState = createGameState(gameConfiguration, sampleFirstTurnVisibleGameInformation)
    const originTile = gameConfiguration.revealed.grid[0][0]
    const otherTile = gameConfiguration.revealed.grid[0][1]
    const marchOrder = stepAway(gameConfiguration, gameState, originTile, originTile)
    const emptyMarchOrder = stepAway(gameConfiguration,gameState, originTile, otherTile)
    expect(marchOrder).to.deep.equal({splitArmy: false, from: { rowIndex: 0, colIndex: 0 }, to: { rowIndex: 1, colIndex: 0 }})


  })
})