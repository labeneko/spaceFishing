import { AudioPresenter } from "./AudioPresenter";
import { FieldScene } from "./FieldScene";
import { Global } from "./Global";
import { NumberFont } from "./NumberValue";
import { OuterParamReceiver } from "./OuterParamReceiver";
import { ResultScene } from "./ResultScene";
import { TitleScene } from "./TitleScene";

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({game: g.game, assetIds: [
		"ui_common", "jin_000", "glyph28", "glyph72", "glyph32_yellow", "bg", "kaizokusen",
		"bgm_130", "se_002c", "title", "se_005A_mono", "se_006B_mono",
		"rocket", "eisei"
	]});
	Global.init();
	
	OuterParamReceiver.receiveParamFromMessage(scene);
	OuterParamReceiver.paramSetting();

	scene.loaded.add(() => {
		AudioPresenter.initialize(scene);
		NumberFont.instance.initialize(scene);

		const title = new TitleScene(scene);
		const field = new FieldScene(scene);
		const result = new ResultScene(scene);

		title.finishCallback.push(() => {
			title.dispose();
			field.activate(scene);
		});
		field.finishCallback.push(() => {
			field.dispose();
			result.activate(scene);
		});
		title.activate(scene);
	});
	g.game.pushScene(scene);
}

export = main;
