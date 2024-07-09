import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AddUserModelComponent } from './add-user-model.component';

describe('AddUserModelComponent', () => {
  let component: AddUserModelComponent;
  let fixture: ComponentFixture<AddUserModelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AddUserModelComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AddUserModelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
