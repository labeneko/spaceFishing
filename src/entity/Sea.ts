import { FISH_FONT_SIZE, FISH_INTERVAL, SWIMMING_TIME_RANGE, WATERSURFACE_POS } from "../constants";
import { Fish } from "./Fish";
import { FishingRod } from "./FishingRod";

/**
 * 魚情報インターフェース
 */
interface FishInfo {
	/**
	 * 魚の名前
	 */
	readonly name: string;

	/**
	 * 画像の名前
	 */
	readonly resourceName: string

	/**
	 * 画像描画サイズ
	 */
	 readonly width: number
	 readonly height: number
	 readonly srcWidth: number
	 readonly srcHeight: number

	/**
	 * 獲得できるスコア
	 */
	readonly score: number;
}

/**
 * 出現する魚の種類
 */
const fishInfoList: FishInfo[] = [
	{name: "ロケット", resourceName: "rocket", width: 100, height: 60, srcWidth: 479, srcHeight: 296, score: 1},
	{name: "衛星", resourceName: "eisei", width: 100, height: 95, srcWidth: 400, srcHeight: 382, score: 10},
	{name: "月", resourceName: "moon", width: 60, height: 60, srcWidth: 200, srcHeight: 200, score: 100},
	{name: "くらげ", resourceName: "kurage", width: 100, height: 95, srcWidth: 381, srcHeight: 400, score: 0},
];

/**
 * 海クラス生成時のパラメータ
 */
export interface SeaParameterObject {
	/**
	 * 親エンティティ
	 */
	readonly parent: g.E;
}

/**
 * 海クラス
 */
export class Sea {
	/**
	 * 釣られた魚リスト
	 */
	capturedFishList: Fish[];

	private _parent: g.E;

	/**
	 * 作成した魚リスト
	 */
	private _fishList: Fish[];

	/**
	 * 魚作成タイマー
	 */
	private _fishTimerIdentifier: g.TimerIdentifier;

	constructor(param: SeaParameterObject){
		this.capturedFishList = [];
		this._parent = param.parent;
		this._fishList = [];
	}

	/**
	 * 定期的に魚を作成する
	 */
	startFishTimer(): void {
		this._fishTimerIdentifier = this._parent.scene.setInterval(() => {
			const fish = this._createRandomFish(this._parent);
			fish.swim();
			this._fishList.push(fish);
		}, FISH_INTERVAL);
	}

	/**
	 * タイマーをクリアする
	 */
	clearFishTimer(): void {
		if (!this._fishTimerIdentifier) return;
		this._parent.scene.clearInterval(this._fishTimerIdentifier);
		this._fishTimerIdentifier = null;
	}

	/**
	 * 釣り針と魚の当たり判定をチェックする
	 */
	checkFishOnHook(fishingRod: FishingRod): void {
		if (!this._fishList.length) return;
		if (!fishingRod.isCatching) return;
		this._fishList.forEach(fish => {
			// 釣り針と魚が当たっていた場合は釣り上げる
			if (g.Collision.intersectAreas(fishingRod.hookArea, fish.area)) {
				if (fish.isCaptured) return;
				fish.stop();
				fish.followHook(fishingRod);
				this._fishList = this._fishList.filter(item => item !== fish);
				this.capturedFishList.push(fish);
			}
		});
	};

	/**
	 * 捕まえた魚たちを destroy する
	 */
	destroyCapturedFish(): void {
		this.capturedFishList.forEach(capturedFish => capturedFish.destroy());
		this.capturedFishList = [];
	}

	/**
	 * ランダムな魚を作成
	 */
	private _createRandomFish(parent: g.E): Fish {
		// 作成する魚の種類
		const fishIdx = g.game.random.get(0, fishInfoList.length - 1);
		// 魚の泳ぎ方のパターン
		const pattern = (g.game.random.get(0, 1)) ? "right_to_left" : "left_to_right";
		// 魚が泳ぐ水深
		const depth = WATERSURFACE_POS.y + FISH_FONT_SIZE * g.game.random.get(0, 4);
		// 魚が泳ぐ時間
		const swimTime = g.game.random.get(SWIMMING_TIME_RANGE.min, SWIMMING_TIME_RANGE.max);

		return new Fish({
			parent: parent,
			name: fishInfoList[fishIdx].name,
			resourceName: fishInfoList[fishIdx].resourceName,
			width: fishInfoList[fishIdx].width,
			height: fishInfoList[fishIdx].height,
			srcWidth: fishInfoList[fishIdx].srcWidth,
			srcHeight: fishInfoList[fishIdx].srcHeight,
			score: fishInfoList[fishIdx].score,
			swimmingStyle: {
				pattern: pattern,
				depth: depth,
				swimTime: swimTime
			}
		});
	}
}
