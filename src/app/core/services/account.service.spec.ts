import { TestBed } from '@angular/core/testing';
import { AccountService } from './account.service';
import { ApiService } from './api.service';
import { of } from 'rxjs';

describe('AccountService', () => {
  let service: AccountService;
  let mockApiService: jasmine.SpyObj<ApiService>;

  beforeEach(() => {
    const apiSpy = jasmine.createSpyObj('ApiService', ['get', 'post', 'put']);

    TestBed.configureTestingModule({
      providers: [
        AccountService,
        { provide: ApiService, useValue: apiSpy }
      ]
    });
    
    service = TestBed.inject(AccountService);
    mockApiService = TestBed.inject(ApiService) as jasmine.SpyObj<ApiService>;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get accounts', () => {
    const mockAccounts = [
      { id: '1', customerId: 'C001', accountNumber: '1234567890', accountType: 'CHECKING', balance: 1000, status: 'ACTIVE', openDate: new Date(), lastActivity: new Date() }
    ];
    
    mockApiService.get.and.returnValue(of({ success: true, data: mockAccounts }));
    
    service.getAccounts().subscribe(accounts => {
      expect(accounts).toEqual(mockAccounts);
      expect(mockApiService.get).toHaveBeenCalledWith('/accounts');
    });
  });

  it('should get account by id', () => {
    const mockAccount = { id: '1', customerId: 'C001', accountNumber: '1234567890', accountType: 'CHECKING', balance: 1000, status: 'ACTIVE', openDate: new Date(), lastActivity: new Date() };
    
    mockApiService.get.and.returnValue(of({ success: true, data: mockAccount }));
    
    service.getAccount('1').subscribe(account => {
      expect(account).toEqual(mockAccount);
      expect(mockApiService.get).toHaveBeenCalledWith('/accounts/1');
    });
  });

  it('should update account', () => {
    const mockAccount = { id: '1', customerId: 'C001', accountNumber: '1234567890', accountType: 'CHECKING', balance: 1000, status: 'ACTIVE', openDate: new Date(), lastActivity: new Date() };
    
    mockApiService.put.and.returnValue(of({ success: true, data: mockAccount }));
    
    service.updateAccount(mockAccount).subscribe(account => {
      expect(account).toEqual(mockAccount);
      expect(mockApiService.put).toHaveBeenCalledWith('/accounts/1', mockAccount);
    });
  });
});