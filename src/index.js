import Phaser from "phaser";
import mapUrl from "./assets/map.json";
import tilesUrl from "./assets/tiles.png";
import coinGoldUrl from "./assets/coinGold.png";
import playerImageUrl from "./assets/player.png";
import playerUrl from "./assets/player.json";
import spikeUrl from "./assets/spike.png"
import { getCanvasSize } from "./utils";

const isDebug = process.env.NODE_ENV === 'development';

/**
 * Returns game config
 * @return {Phaser.Types.Core.GameConfig}
 */

 function getConfig() {
    const { height, width } = getCanvasSize();
    return {
        title: "Игра",
        type: Phaser.AUTO,
        parent: "phaser-example",
        width: width,
        height: height,
        physics: {
            default: 'arcade',
            arcade: {
                gravity: {y: 500}, // will affect our player sprite
                debug: false // change if you need
            }
        },
        scene: {
            key: 'main',
            preload: preload,
            create: create,
            update: update
        }
    };
}



let map;
let player;
let cursors;
let groundLayer, coinLayer, usingLayer, spikeLayer;
let text;
let score = 0;

const game = new Phaser.Game(getConfig());

let UseKey;

function update(time, delta) {
    if (cursors.left.isDown)
    {
        player.body.setVelocityX(-400);
        player.anims.play('walk', true); // walk left
        player.flipX = true; // flip the sprite to the left
    }
    else if (cursors.right.isDown)
    {
        player.body.setVelocityX(400);
        player.anims.play('walk', true);
        player.flipX = false; // use the original sprite looking to the right
    } else {
        player.body.setDragX(2400);
        player.anims.play('idle', true);
    }
    // jump 
    if ((cursors.up.isDown || cursors.space.isDown) && player.body.onFloor())
    {
        player.body.setVelocityY(-500);        
    }
    // if (UseKey.isDown && this.physics.overlap(player, usingLayer)) {console.log("Using This Yellow Thing!")}
}

function preload() {
    // map made with Tiled in JSON format
    this.load.tilemapTiledJSON('map', mapUrl);
    // tiles in spritesheet
    this.load.spritesheet('tiles', tilesUrl, {frameWidth: 70, frameHeight: 70});
    // simple coin image
    this.load.image('coin', coinGoldUrl);
    this.load.image('spike', spikeUrl);
    // player animations
    this.load.atlas('player', playerImageUrl, playerUrl);
}

function create() {
    UseKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.F);

    // load the map
    map = this.make.tilemap({key: 'map'});

    // tiles for the ground layer
    let groundTiles = map.addTilesetImage('tiles');
    // create the ground layer
    groundLayer = map.createDynamicLayer('World', groundTiles, 0, 0);
    // the player will collide with this layer
    groundLayer.setCollisionByExclusion([-1]);

    // coin image used as tileset
    let coinTiles = map.addTilesetImage('coin');
    // add coins as tiles
    coinLayer = map.createDynamicLayer('Coins', coinTiles, 0, 0);

    usingLayer = map.createDynamicLayer('Using', groundTiles, 0, 0);

    let spikeTiles = map.addTilesetImage('spike');
    spikeLayer = map.createDynamicLayer('Spikes', spikeTiles, 0, 0);

    // set the boundaries of our game world
    this.physics.world.bounds.width = groundLayer.width;
    this.physics.world.bounds.height = groundLayer.height;

    // create the player sprite
    player = this.physics.add.sprite(200, 200, 'player');
    player.setBounce(0.2); // our player will bounce from items
    player.setCollideWorldBounds(true); // don't go out of the map

    // small fix to our player images, we resize the physics body object slightly
    player.body.setSize(player.width, player.height-8);
    // player will collide with the level tiles
    this.physics.add.collider(groundLayer, player);

    coinLayer.setTileIndexCallback(17, collectCoin, this);
    // when the player overlaps with a tile with index 17, collectCoin
    // will be called
    this.physics.add.overlap(player, coinLayer);

    usingLayer.setTileIndexCallback(7, useThing);
    this.physics.add.overlap(player, usingLayer);
    
    spikeLayer.setTileIndexCallback(18, restart, this);
    this.physics.add.overlap(player, spikeLayer);

    // player walk animation
    this.anims.create({
        key: 'walk',
        frames: this.anims.generateFrameNames('player', {prefix: 'p1_walk', start: 1, end: 11, zeroPad: 2}),
        frameRate: 10,
        repeat: -1
    });
    // idle with only one frame, so repeat is not neaded
    this.anims.create({
        key: 'idle',
        frames: [{key: 'player', frame: 'p1_stand'}],
        frameRate: 10,
    });


    cursors = this.input.keyboard.createCursorKeys();

    // set bounds so the camera won't go outside the game world
    this.cameras.main.setBounds(0, 0, map.widthInPixels, map.heightInPixels);
    // make the camera follow the player
    this.cameras.main.startFollow(player);

    // set background color, so the sky is not black
    this.cameras.main.setBackgroundColor('#ccccff');

    // this text will show the score
    text = this.add.text(20, 570, '0', {
        fontSize: '20px',
        fill: '#ffffff'
    });
    // fix the text to the camera
    text.setScrollFactor(0);
}

// this function will be called when the player touches a coin
function collectCoin(sprite, tile) {
    coinLayer.removeTileAt(tile.x, tile.y); // remove the tile/coin
    score++; // add 10 points to the score
    text.setText(score); // set the text to show the current score
    return false;
}

function useThing(sprite, tile) {
  if(UseKey.isDown) {
    // console.log("Using This Thing!", tile.x, tile.y);
    tile.y--;
    tile.updatePixelXY()
  }
  return false;
}

function restart() {
  this.scene.restart();
}