import {
    SymSimOne,
    GrayScottSimulationCreator,
    Group_KLM,

}
from './modules.js';

import {
    gray_scott_samples_klm
}
from './gray_scott_samples_klm.js';

try {

    let ss = SymSimOne({
        simCreator: GrayScottSimulationCreator,
        samples: gray_scott_samples_klm,
        groupMaker:  new Group_KLM({}), // maker of the groups
    });
    ss.run();

} catch (err) {
    console.error('error: ', err);
}