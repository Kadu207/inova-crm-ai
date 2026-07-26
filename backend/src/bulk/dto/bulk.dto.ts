import { IsIn, IsString, MaxLength } from 'class-validator';

export class CreateBulkExportDto {
  @IsString()
  @IsIn(['leads', 'contacts', 'companies'])
  module!: string;
}

export class CreateBulkImportDto {
  @IsString()
  @IsIn(['leads', 'contacts'])
  module!: string;

  @IsString()
  @MaxLength(2_000_000)
  csv!: string;
}
