import React from 'react';
import './App.css';
import createEngine, {
	DagreEngine,
	DiagramEngine,
	DiagramModel,
	PathFindingLinkFactory
} from '@projectstorm/react-diagrams';
import { CanvasWidget } from '@projectstorm/react-canvas-core';

import { DemoButton, DemoWorkspaceWidget } from './Components/DemoWorkspaceWidget';
import { DemoCanvasWidget } from './Components/DemoCanvasWidget';
import { ComponentNodeFactory } from './Components/Diagram/ComponentNodeFactory';
import { LoadButton } from './Components/Toolbar/LoadButton';
import { ClearButton } from './Components/Toolbar/ClearButton';
import { KeepModelCheckbox } from './Components/Toolbar/KeepModelCheckbox';
import { CacheInfo, LOCAL_STORAGE_NAME } from './Model/CacheInfo';
import { AppArray } from './Model/Model';
import { SystemDiagramModel } from './Model/SystemDiagramModel';
import { ConnectedStatusText } from './Components/StatusBar/ConnectedStatusText';
import { ModelService } from './Service/ModelService';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

class SystemWidget extends React.Component<{ engine: DiagramEngine }, { model: DiagramModel, checked: boolean, connected: boolean, connectionInfo: String }> {
	engine: DagreEngine;
	cacheInfo: CacheInfo;
	modelService: ModelService;

	constructor(props: any) {
		super(props);
		const cacheInfoValue = localStorage.getItem(LOCAL_STORAGE_NAME.CACHE);
		this.cacheInfo = cacheInfoValue !== null ? new CacheInfo(JSON.parse(cacheInfoValue)) : new CacheInfo(null);
		this.cacheInfo.host = "http://localhost:9090";
		this.modelService = new ModelService(this.cacheInfo.host);
		
		let model = new DiagramModel();
		
		this.engine = new DagreEngine({
			graph: {
				rankdir: 'LR',
				ranker: 'longest-path',
				marginx: 25,
				marginy: 25
			},
			includeLinks: false
		});
		this.props.engine.setModel(model)

		this.state = {
			model,
			checked: !this.cacheInfo.keepModel,
			connected: false,
			connectionInfo: "",
		};
	}

	onModelConnected = () => {
		toast.success("Connected")
		this.setState({connected: true, connectionInfo: this.cacheInfo.host});
	}

	onModelConnectionError = (err: any) => {
		toast.error("Connection lost to " + this.cacheInfo.host)
		this.setState({connected: false, connectionInfo: err});
	}

	updateCacheModel = () => {
		if (this.cacheInfo.keepModel && this.state.model instanceof SystemDiagramModel) {
			const systemModel = this.state.model as SystemDiagramModel;
			this.cacheInfo.model = JSON.stringify(systemModel.getApplication());
		}
		else {
			this.cacheInfo.model = "";
		}
		this.cacheInfo.save();
	};

	onModelChange = (model: DiagramModel) => {
		this.props.engine.setModel(model);
		this.setState({ model }, () => {
			this.updateCacheModel();
			this.autoDistribute();
			this.modelService.sendModel(model);
		});
	};

	onCheckBoxChanged = (event: React.ChangeEvent<HTMLInputElement>) => {
		this.setState(state => ({
			checked: !event.target.checked
		}));
		this.cacheInfo.keepModel = this.state.checked;
		this.updateCacheModel();
	}

	autoDistribute = () => {
		this.engine.redistribute(this.state.model);
		this.reroute();
		this.props.engine.repaintCanvas();
	};

	componentDidMount(): void {
		this.modelService.connect(this.onModelConnected, this.onModelConnectionError);

		if(this.cacheInfo.model !== "") {
			const application = JSON.parse(this.cacheInfo.model as string) as AppArray.Model.Application;
			const model = new SystemDiagramModel(application);
			this.props.engine.setModel(model);
			this.setState({ model }, () => {
				this.updateCacheModel();
				this.modelService.sendModel(model);
			});
			
		}

		setTimeout(() => {
			this.autoDistribute();
		}, 1000);
	}

	reroute() {
		this.props.engine
			.getLinkFactories()
			.getFactory<PathFindingLinkFactory>(PathFindingLinkFactory.NAME)
			.calculateRoutingMatrix();
	}

	render() {
		return (
			<DemoWorkspaceWidget buttons={
				<>
					<DemoButton onClick={this.autoDistribute}>Re-distribute</DemoButton>
					<LoadButton onModelChange={(model) => this.onModelChange(model)}/>
					<ClearButton onModelChange={(model) => this.onModelChange(model)}/>
				</>}
				options={
					<>
					<ToastContainer />
					<KeepModelCheckbox checked={!this.state.checked} onChange={this.onCheckBoxChanged} />
					</>
				}
				statusItems={
					<>
					<ConnectedStatusText isConnected={this.state.connected} path={this.state.connectionInfo}></ConnectedStatusText>
					</>
				}>
				<DemoCanvasWidget>
					<CanvasWidget engine={this.props.engine} />
				</DemoCanvasWidget>
			</DemoWorkspaceWidget>
		);
	}
}

function App() {
	let engine = createEngine();
	engine.getNodeFactories().registerFactory(new ComponentNodeFactory());

	return <SystemWidget engine={engine} />;
}

export default App;
