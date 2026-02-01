import { Test, TestingModule } from '@nestjs/testing';
import {
  ReservationClientService,
  RatingValidationResponse,
} from './reservation-client.service';
import { of, throwError } from 'rxjs';
import { Logger } from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';

interface MockReservationGrpcService {
  getReservationForRating: jest.Mock;
}

describe('ReservationClientService', () => {
  let service: ReservationClientService;
  let mockGrpcService: MockReservationGrpcService;

  const mockClientGrpc: jest.Mocked<Partial<ClientGrpc>> = {
    getService: jest.fn(),
  };

  beforeEach(async () => {
    mockGrpcService = {
      getReservationForRating: jest.fn(),
    };

    (mockClientGrpc.getService as jest.Mock).mockReturnValue(mockGrpcService);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReservationClientService,
        {
          provide: 'RESERVATION_PACKAGE',
          useValue: mockClientGrpc,
        },
      ],
    }).compile();

    service = module.get<ReservationClientService>(ReservationClientService);
    service.onModuleInit();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('validateReservationForRating', () => {
    const reservationId = 'res_123';
    const guestId = 'usr_guest_1';

    it('should return validation data on successful gRPC call', async () => {
      const expectedResponse: RatingValidationResponse = {
        canRate: true,
        hostId: 'host_1',
        accommodationId: 'acc_1',
        isPast: true,
      };

      mockGrpcService.getReservationForRating.mockReturnValue(
        of(expectedResponse),
      );

      const result = await service.validateReservationForRating(
        reservationId,
        guestId,
      );

      expect(mockGrpcService.getReservationForRating).toHaveBeenCalledWith({
        reservationId,
        guestId,
      });
      expect(result).toEqual(expectedResponse);
    });

    it('should return false-state object and log error when gRPC call fails', async () => {
      const loggerSpy = jest
        .spyOn(Logger, 'error')
        .mockImplementation(() => undefined);

      mockGrpcService.getReservationForRating.mockReturnValue(
        throwError(() => new Error('gRPC Error')),
      );

      const result = await service.validateReservationForRating(
        reservationId,
        guestId,
      );

      expect(result).toEqual({
        canRate: false,
        hostId: '',
        accommodationId: '',
        isPast: false,
      });
      expect(loggerSpy).toHaveBeenCalled();

      loggerSpy.mockRestore();
    });
  });
});
