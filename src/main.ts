import { AudioPresenter } from "./AudioPresenter";
import { FieldScene } from "./FieldScene";
import { Global } from "./Global";
import { OuterParamReceiver } from "./OuterParamReceiver";
import { ResultScene } from "./ResultScene";

function main(param: g.GameMainParameterObject): void {
	const scene = new g.Scene({game: g.game, assetIds: [
		"ui_common"
	]});
	Global.init();
	
	OuterParamReceiver.receiveParamFromMessage(scene);
	OuterParamReceiver.paramSetting();

	scene.loaded.add(() => {
		console.log(scene.game)
		AudioPresenter.initialize(scene);

		const field = new FieldScene(scene);
		const result = new ResultScene(scene);
		field.finishCallback.push(() => {
			console.log("finish!");
			console.log(scene);
			field.dispose();
			result.activate(scene);
		});
		field.activate(scene);
	});
	g.game.pushScene(scene);
}

export = main;
