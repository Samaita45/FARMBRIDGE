import { Type } from 'class-transformer';
import {
  IsLatitude,
  IsLongitude,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';

export class AutocompleteQueryDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  q!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  session?: string;
}

/** The details endpoint takes the same session token the autocomplete used. */
export class PlaceDetailsQueryDto {
  @IsOptional()
  @IsString()
  @MaxLength(80)
  session?: string;
}

export class GeocodeQueryDto {
  @IsString()
  @MinLength(3)
  @MaxLength(300)
  address!: string;
}

export class LatLngDto {
  @IsNumber()
  @IsLatitude()
  latitude!: number;

  @IsNumber()
  @IsLongitude()
  longitude!: number;
}

export class ComputeRouteDto {
  @ValidateNested()
  @Type(() => LatLngDto)
  origin!: LatLngDto;

  @ValidateNested()
  @Type(() => LatLngDto)
  destination!: LatLngDto;
}
