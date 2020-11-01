import { BigInt, log } from '@graphprotocol/graph-ts'
import {
  PrizePool,
  SingleRandomWinner,
} from '../generated/schema'

import {
  SingleRandomWinner as SingleRandomWinnerContract,
  TokenListenerUpdated,
  PrizePoolOpened,
  PrizePoolAwardStarted,
  PrizePoolAwarded,
  RngServiceUpdated,
  OwnershipTransferred,
  ExternalErc20AwardAdded,
  ExternalErc20AwardRemoved,
  ExternalErc721AwardAdded,
  ExternalErc721AwardRemoved,
} from '../generated/templates/SingleRandomWinner/SingleRandomWinner'

import { loadOrCreateComptroller } from './helpers/loadOrCreateComptroller'
import { loadOrCreatePrize } from './helpers/loadOrCreatePrize'
import { loadOrCreateSingleRandomWinner } from './helpers/loadOrCreateSingleRandomWinner'
import {
  loadOrCreateExternalErc20Award,
  loadOrCreateExternalErc721Award,
  loadOrCreateExternalErc721AwardToken,
} from './helpers/loadOrCreateExternalAward'

import { ONE } from './helpers/common'


export function handlePrizePoolOpened(event: PrizePoolOpened): void {
  // no-op
}

export function handleOwnershipTransferred(event: OwnershipTransferred): void {
  const _prizeStrategy = loadOrCreateSingleRandomWinner(event.address)
  _prizeStrategy.owner = event.params.newOwner
  _prizeStrategy.save()
}

export function handleTokenListenerUpdated(event: TokenListenerUpdated): void {
  const _prizeStrategy = loadOrCreateSingleRandomWinner(event.address)
  const _comptroller = loadOrCreateComptroller(event.params.tokenListener)

  _prizeStrategy.tokenListener = _comptroller.id
  _prizeStrategy.save()
}

export function handlePrizePoolAwardStarted(event: PrizePoolAwardStarted): void {
  const _prizeStrategy = SingleRandomWinner.load(event.address.toHex())
  const boundPrizeStrategy = SingleRandomWinnerContract.bind(event.address)

  const _prizePool = PrizePool.load(_prizeStrategy.prizePool)
  _prizePool.currentState = "Started"
  _prizePool.prizesCount = _prizePool.prizesCount.plus(ONE)
  _prizePool.save()

  const _prize = loadOrCreatePrize(
    _prizeStrategy.prizePool,
    _prizePool.currentPrizeId.toString()
  )

  _prize.prizePeriodStartedTimestamp = boundPrizeStrategy.prizePeriodStartedAt()
  _prize.awardStartOperator = event.params.operator
  _prize.lockBlock = event.params.rngLockBlock
  _prize.rngRequestId = event.params.rngRequestId
  _prize.save()
}

export function handlePrizePoolAwarded(event: PrizePoolAwarded): void {
  const _prizeStrategy = SingleRandomWinner.load(event.address.toHexString())
  const _prizePool = PrizePool.load(_prizeStrategy.prizePool)

  // Record prize history
  const _prize = loadOrCreatePrize(
    _prizeStrategy.prizePool,
    _prizePool.currentPrizeId.toString()
  )
  _prize.awardedOperator = event.params.operator
  _prize.randomNumber = event.params.randomNumber
  _prize.awardedBlock = event.block.number
  _prize.awardedTimestamp = event.block.timestamp
  _prize.totalTicketSupply = _prizePool.totalSupply
  _prize.save()

  _prizePool.currentState = "Awarded"
  _prizePool.currentPrizeId = _prizePool.currentPrizeId.plus(ONE)
  _prizePool.save()
}

export function handleRngServiceUpdated(event: RngServiceUpdated): void {
  const _prizeStrategy = SingleRandomWinner.load(event.address.toHexString())
  _prizeStrategy.rng = event.params.rngService
  _prizeStrategy.save()
}

export function handleExternalErc20AwardAdded(event: ExternalErc20AwardAdded): void {
  const _prizeStrategyAddress = event.address.toHex()
  const _prizeStrategy = SingleRandomWinner.load(_prizeStrategyAddress)

  const externalAward = loadOrCreateExternalErc20Award(_prizeStrategyAddress, event.params.externalErc20)

  const externalErc20Awards = _prizeStrategy.externalErc20Awards
  externalErc20Awards.push(externalAward.id)
  _prizeStrategy.externalErc20Awards = externalErc20Awards

  _prizeStrategy.save()
}

export function handleExternalErc20AwardRemoved(event: ExternalErc20AwardRemoved): void {
  log.warning('implement handleExternalErc20AwardRemoved', [])
}

let ZERO_BI = BigInt.fromI32(0)
let ONE_BI = BigInt.fromI32(1)

export function handleExternalErc721AwardAdded(event: ExternalErc721AwardAdded): void {
  const _prizeStrategyAddress = event.address.toHex()
  const _prizeStrategy = SingleRandomWinner.load(_prizeStrategyAddress)

  const externalAward = loadOrCreateExternalErc721Award(_prizeStrategyAddress, event.params.externalErc721)

  const tokenIds = event.params.tokenIds
  // tokenIds.push(externalAward.id)
  // _prizeStrategy.externalErc721Awards = externalErc721Awards

  for (let i = ZERO_BI; i.lt(BigInt.fromI32(tokenIds.length)); i = i.plus(ONE_BI)) {
    let tokenId = tokenIds[i.toI32()]
    log.warning('tokenId {}', [tokenId.toString()])
   
    log.warning('event.address.toHex() {}', [event.address.toHex()])
    log.warning('event.params.externalErc721.toHex() {}', [event.params.externalErc721.toHex()])

    loadOrCreateExternalErc721AwardToken(
      event.address.toHex(),
      event.params.externalErc721,
      tokenId.toString()
    )
    
    // token.save()
  }

  // const externalErc721Awards = _prizeStrategy.externalErc721Awards
  // externalErc721Awards.push(externalAward.id)
  // _prizeStrategy.externalErc721Awards = externalErc721Awards

  // event.params.tokenIds.forEach(tokenId => {
  //   log.warning('event.address.toHex() {}', [event.address.toHex()])
  //   log.warning('event.params.externalErc721.toHex() {}', [event.params.externalErc721.toHex()])
  //   log.warning('tokenId {}', [tokenId.toString()])

  //   const token = loadOrCreateExternalErc721AwardToken(
  //     event.address.toHex(),
  //     event.params.externalErc721,
  //     tokenId.toString()
  //   )
  //   token.save()
  // })

  // const externalErc721Awards = _prizeStrategy.externalErc721Awards
  // externalErc721Awards.push(externalAward.id)
  // _prizeStrategy.externalErc721Awards = externalErc721Awards
  
  externalAward.save()

  // const externalErc721Awards = _prizeStrategy.externalErc721Awards
  // externalErc721Awards.push(externalAward.id)
  // _prizeStrategy.externalErc721Awards = externalErc721Awards

  log.warning('externalAward.id {}', [externalAward.id])
  // if (externalErc721Awards.length > 0) {
  //   const firstItem = externalErc721Awards[0] as string
  //   log.warning('externalErc721Awards {}', [firstItem])
  // }

  // _prizeStrategy.save()
}

export function handleExternalErc721AwardRemoved(event: ExternalErc721AwardRemoved): void {
  log.warning('implement handleExternalErc721AwardRemoved', [])
}
