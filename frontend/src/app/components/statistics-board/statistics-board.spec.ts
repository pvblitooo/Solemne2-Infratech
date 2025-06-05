import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatisticsBoard } from './statistics-board';

describe('StatisticsBoard', () => {
  let component: StatisticsBoard;
  let fixture: ComponentFixture<StatisticsBoard>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatisticsBoard]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatisticsBoard);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
