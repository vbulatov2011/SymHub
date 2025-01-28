import {
    SymSimOne,
    GrayScottSimulationCreator,
    Group_WP,
    PlaneNavigator, 

}
from './modules.js';

import {
    gray_scott_samples_wp
}
from './gray_scott_samples_wp.js';

//try {
    let ss = SymSimOne({
        simCreator: GrayScottSimulationCreator,
        samples: gray_scott_samples_wp,
        groupMaker:  new Group_WP({type: '333',a: 0.4}), // maker of the groups
    });
    ss.run();

//} catch (err) {
//    console.error('error: ', err);
//}