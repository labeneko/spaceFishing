import { Tween } from "@akashic-extension/akashic-timeline";
import { FISH_FONT_SIZE } from "../constants";
import { getResources } from "../Resources";
import { FishingRod } from "./FishingRod";

/**
 * 魚クラス生成時のパラメータ
 */
export interface FishParameterObject {
	/**
	 * 親エンティティ
	 */
	readonly parent: g.E;
	/**
	 * 魚の名前(文字列)
	 */
	readonly name: string;
	/**
	 * 魚のリソース名(文字列)
	 */
	 readonly resourceName: string;
	/**
	 * 魚を釣ったときのスコア
	 */
	readonly score: number;
	/**
	 * 泳ぎ方
	 */
	readonly swimmingStyle: SwimmingStyle;
}

/**
 * 泳ぎ方インターフェース
 */
export interface SwimmingStyle {
	/**
	 * 魚が動く方向
	 */
	readonly pattern: "left_to_right" | "right_to_left";
	/**
	 * 魚が泳いでいる深さ (y座標)
	 */
	readonly depth: number;
	/**
	 * 魚の移動時間 (ミリ秒)
	 */
	readonly swimTime: number;
}

/**
 * 魚クラス
 */
export class Fish {
	private _parent: g.E;
	private _sprite: g.Sprite;
	private _score: number;
	private _swimmingStyle: SwimmingStyle;
	private _name: string;

	/**
	 * 泳ぐアニメーション用の Tween
	 */
	private _swimTween: Tween | null = null;
	/**
	 *  既に釣り上げられたかどうか
	 */
	private _isCaptured: boolean;

	constructor(param: FishParameterObject) {
		this._parent = param.parent;
		this._sprite = this._createSprite(param);
		this._parent.append(this._sprite);
		this._isCaptured = false;
		this._score = param.score;
		this._swimmingStyle = param.swimmingStyle;
		this._name = param.name;
	}

	get isCaptured(): boolean {
		return this._isCaptured;
	}

	get name(): string {
		return this._name;
	}

	get score(): number {
		return this._score;
	}

	/**
	 * 魚の当たり判定を返す
	 */
	get area(): g.CommonArea {
		return {
			width: this._sprite.width,
			height: this._sprite.height,
			x: this._sprite.x,
			y: this._sprite.y
		};
	}

	destroy(): void {
		this._sprite.destroy();
	}

	/**
	 * 釣られる
	 */
	followHook(fishingRod: FishingRod): void {
		this._sprite.update.add(() => {
			this._sprite.y = Math.min(fishingRod.hookArea.y, this._sprite.y);
			this._sprite.modified();
		});
	}

	/**
	 * 泳ぐ
	 */
	swim(): void {
		const timeline = getResources().timeline;
		const toX = this._sprite.x < g.game.width / 2 ? g.game.width : -this._sprite.width;
		if (this._swimTween) {
			timeline.remove(this._swimTween);
		}
		this._swimTween = timeline
			.create(this._sprite)
			.moveTo(toX, this._sprite.y, this._swimmingStyle.swimTime)
			.call(() => this._sprite.destroy());
	}

	/**
	 * 泳ぎをやめる
	 */
	stop(): void {
		this._isCaptured = true;
		if (this._swimTween) {
			getResources().timeline.remove(this._swimTween);
			this._swimTween = null;
		}
	}

	/**
	 * 魚ラベル作成
	 */
	private _createSprite(param: FishParameterObject): g.Sprite {
		return new g.Sprite({
			scene: param.parent.scene,
			src: param.parent.scene.assets[param.resourceName],
			...this._initialPos(param)
		});
	}

	/**
	 * 初期位置生成
	 */
	private _initialPos(param: FishParameterObject): g.CommonOffset {
		switch (param.swimmingStyle.pattern) {
			case "left_to_right":
				return { x: -FISH_FONT_SIZE, y: param.swimmingStyle.depth };
			case "right_to_left":
				return { x: g.game.width, y: param.swimmingStyle.depth };
		}
	}
}
