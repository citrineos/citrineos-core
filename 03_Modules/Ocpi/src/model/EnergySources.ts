
import {
	IsString,
	IsNotEmpty,
	Max,
	IsNumber,
} from 'class-validator';
import {EnergySourceCategory} from './EnergySourceCategory';


export class EnergySources {
	@IsString()
	@IsNotEmpty()
	source: EnergySourceCategory;

	@Max(100)
	@IsNumber()
	@IsNotEmpty()
	percentage: number;

}
