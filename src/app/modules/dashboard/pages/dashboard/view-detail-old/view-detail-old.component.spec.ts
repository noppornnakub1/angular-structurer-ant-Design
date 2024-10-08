import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ViewDetailOldComponent } from './view-detail-old.component';

describe('ViewDetailOldComponent', () => {
  let component: ViewDetailOldComponent;
  let fixture: ComponentFixture<ViewDetailOldComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ViewDetailOldComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ViewDetailOldComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
