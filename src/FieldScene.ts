import { Global } from "./Global";
import { AudioPresenter } from "./AudioPresenter";
import { AStage } from "./AStage";
import { OuterParamReceiver } from "./OuterParamReceiver";
import { Util } from "./Util";
import { FishingRod } from "./entity/FishingRod";
import { HUDManager } from "./HUDManager";
import { Sea } from "./entity/Sea";
import { getResources, setResources } from "./Resources";

import {
	BACKGROUND_ALPHA,
	BACKGROUND_COLOR,
	BEAR_COLOR,
	BEAR_POS,
	BEAR_SIZE,
	FONT_FAMILY,
	FONT_SIZE,
	GRASS_COLOR,
	GRASS_POS,
	GRASS_SIZE,
	ISLAND_COLOR,
	ISLAND_POS,
	ISLAND_SIZE,
	STUCK_DURATION,
	TIMELIMIT,
	WATERSURFACE_COLOR,
	WATERSURFACE_POS
} from "./constants";
import { Timeline } from "@akashic-extension/akashic-timeline";
import { FieldScore } from "./FieldScore";
import { Fish } from "./entity/Fish";

export class FieldScene extends AStage {
	private scene: g.Scene;
	private root: g.E;
	private sea: Sea;
	private fishingRod: FishingRod;
	private hudManager: HUDManager;
	private isPlaying: boolean = false;
	private static readonly FIELDSCORE_POS_X: number = 552;
	private static readonly FIELDSCORE_POS_Y: number = 0;

	private scoreView: FieldScore;
	private score: number = 0;

	constructor(_scene: g.Scene) {
		super();
		this.scene = _scene;
		setResources({
			timeline: new Timeline(_scene),
			font: createFont(),
			timeLimit: 10
		});
	}

	activate(_scene: g.Scene) {

		/**
		 * 釣り部分を作成
		 */
		this.root = new g.E({ scene: _scene });
		this.scene.append(this.root);
		createStage(this.root);
		createBear(this.root);
		this.sea = createSea(this.root);
		this.fishingRod = createFishingRod(this.root);
		this.hudManager = createHUDManager(this.root);
		this.scene.update.add(() => {
			this.step();
		});
		this.scene.pointDownCapture.add(() => {
			this.onPointDown();
		});

		/**
		 * スコア部分を作成
		 */
		const _sv = new FieldScore(_scene);
		_sv.init(_scene);
		this.scene.append(_sv.rootEntity);
		_sv.show(_scene, FieldScene.FIELDSCORE_POS_X, FieldScene.FIELDSCORE_POS_Y);
		_sv.value = this.score;
		this.scoreView = _sv;

		this.start()
	}

	/**
	 * ゲームを開始する
	 */
	start(): void {
		this.hudManager.startCountdown(() => this._startGame());
	}

	/**
	 * ゲームを1フレーム進める
	 */
	step(): void {
		if (!this.isPlaying) return;
		this.sea.checkFishOnHook(this.fishingRod);
		this.hudManager.updateTime();
		if (this.hudManager.getNowTime() <= 0) {
			// ゲーム終了
			this.isPlaying = false;
			this.finishStage();
		}
	}

	/**
	 * タップしたときの処理
	 */
	onPointDown(): void {
		if (!this.isPlaying) return;
		this.fishingRod.catchUp(() => {
			const pattern = this.fishingRod.getFishingPattern(this.sea.capturedFishList);
			this.addScore(this.hudManager.calcScore(this.sea.capturedFishList));
			this.fishingRod.fishing(pattern);
			this.sea.destroyCapturedFish();
		});
	}

	/**
	 * ゲーム本編開始
	 */
	private _startGame(): void {
		this.isPlaying = true;
		this.sea.startFishTimer();
	}

	dispose() {
		if (this.scene.destroyed()) {
			return;
		}
		// なぜ
		//this.scene.destroy();
	}

	/**
	 * スコアをセットする
	 */
	 setScore(score: number): void {
		score = Math.min(score, 99999);
		this.score = score;
		Global.instance.score = score;
	}

	/**
	 * スコアの加算
	 */
	 addScore(score: number): void {
		this.setScore(this.score + score);
		this.scoreView.value = this.score;
		OuterParamReceiver.setGlobalScore(this.score);
	}

	/**
	 * 釣った魚からスコアを計算
	 */
	calcScore(capturedFishList: Fish[]): number {
		if (capturedFishList.some(fish => fish.score === 0)){
			return 0;
		}
		return capturedFishList.reduce((score, fish) => score += fish.score, 0);
	}
}

/**
 * フォントを作成
 */
 function createFont(): g.DynamicFont {
	return new g.DynamicFont({
		game: g.game,
		fontFamily: FONT_FAMILY,
		size: FONT_SIZE
	});
}

/**
 * 背景を作成
 */
function createStage(parent: g.E): void {
	new g.Sprite({
		scene: parent.scene,
		src: parent.scene.assets["bg"],
		width: g.game.width,
		height: g.game.height,
		parent: parent
	});
}

/**
 * くまを作成
 */
function createBear(parent: g.E): void {
	new g.Sprite({
		scene: parent.scene,
		src: parent.scene.assets["kaizokusen"],
		width: 400,
		scaleX: 0.4,
		scaleY: 0.4,
		x: -120,
		y: -50,
		parent: parent
	});
}

/**
 * 海を作成
 */
function createSea(parent: g.E): Sea {
	return new Sea({ parent });
}

/**
 * 釣竿を作成
 */
function createFishingRod(parent: g.E): FishingRod {
	const fishingRod = new FishingRod({ parent: parent });
	fishingRod.onStuck.add(() => {
		createMissLabel(parent);
	});
	return fishingRod;
}

/**
 * HUDマネージャーを作成
 */
function createHUDManager(parent: g.E): HUDManager {
	const hudManager = new HUDManager({
		timeLabel: createTimeLabel(parent),
		systemLabel: createSystemLabel(parent)
	});
	hudManager.setTimeLimit(getResources().timeLimit);
	return hudManager;
}

/**
 * 制限時間ラベルを作成
 */
function createTimeLabel(parent: g.E): g.Label {
	return new g.Label({
		scene: parent.scene,
		text: "",
		font: getResources().font,
		fontSize: FONT_SIZE,
		width: g.game.width - 220,
		y: 5,
		textAlign: g.TextAlign.Right,
		widthAutoAdjust: false,
		parent: parent
	});
}

/**
 *  システムラベルを作成
 */
function createSystemLabel(parent: g.E): g.Label {
	return new g.Label({
		scene: parent.scene,
		text: "3",
		font: getResources().font,
		fontSize: FONT_SIZE * 2,
		x: g.game.width / 2,
		y: g.game.height / 2,
		anchorX: 0.5,
		anchorY: 0.5,
		parent: parent
	});
}

/**
 * 釣りミス時のラベルを作成
 */
function createMissLabel(parent: g.E): void {
	const missLabel = new g.Label({
		scene: parent.scene,
		text: "miss!",
		textColor: "red",
		font: getResources().font,
		fontSize: Math.floor(FONT_SIZE / 2),
		x: BEAR_POS.x + BEAR_SIZE.width * 2,
		y: BEAR_POS.y,
		parent: parent
	});
	getResources()
		.timeline.create(missLabel)
		.wait(STUCK_DURATION)
		.call(() => missLabel.destroy());
}

